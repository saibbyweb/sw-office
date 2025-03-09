import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import styled from 'styled-components';
import { useQuery } from '@apollo/client';
import { TEAM_USERS_QUERY } from '../../graphql/queries';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { TextureLoader } from 'three';

const Container = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  background: transparent;
`;

const ControlPanel = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: ${props => props.theme.colors.background}99;
  padding: 1rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  padding: 0.5rem 1rem;
  background: ${props => props.theme.colors.background}99;
  border: none;
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  backdrop-filter: blur(10px);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${props => props.theme.colors.background};
  }
`;

interface Chair {
  mesh: THREE.Group;
  targetPosition: THREE.Vector3;
  userId: string;
  isActive: boolean;
}

interface User {
  id: string;
  name: string;
  activeSession: any;
}

// Add texture loader before materials
const textureLoader = new TextureLoader();

// Materials for the chair
const chairMaterials = {
  metal: new THREE.MeshPhongMaterial({
    color: 0xCCCCCC,
    shininess: 100,
    specular: 0x666666,
    map: textureLoader.load('/textures/chair/metal.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);
      texture.colorSpace = THREE.SRGBColorSpace;
    })
  }),
  fabric: new THREE.MeshPhongMaterial({
    color: 0x333333,
    shininess: 5,
    map: textureLoader.load('/textures/chair/fabric.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 3);
      texture.colorSpace = THREE.SRGBColorSpace;
    })
  }),
  plastic: new THREE.MeshPhongMaterial({
    color: 0x222222,
    shininess: 40,
    map: textureLoader.load('/textures/chair/plastic.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      texture.colorSpace = THREE.SRGBColorSpace;
    })
  }),
  text: new THREE.MeshPhongMaterial({
    color: 0xFFFFFF,
    shininess: 30,
  })
};

// Table materials with wood texture
const tableMaterials = {
  wood: new THREE.MeshPhongMaterial({
    map: textureLoader.load('/textures/floor.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(0.5, 0.5); // Adjust the texture scale
      texture.colorSpace = THREE.SRGBColorSpace;
    }),
    shininess: 40,
    specular: 0x444444,
  }),
  legs: new THREE.MeshPhongMaterial({
    color: 0x1a1a1a,  // Matte black
    shininess: 30,
    specular: 0x222222,
  })
};

// Room materials
const roomMaterials = {
  floor: new THREE.MeshPhongMaterial({
    color: 0x808080, // Medium gray color
    shininess: 60,
  }),
  walls: new THREE.MeshPhongMaterial({
    color: 0xe0e0e0,
    shininess: 5,
    side: THREE.DoubleSide,
    map: textureLoader.load('/textures/wall/wall.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 2);
      texture.colorSpace = THREE.SRGBColorSpace;
    })
  })
};

// Add decoration materials
const decorMaterials = {
  white: new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 30,
  }),
  plant: new THREE.MeshPhongMaterial({
    color: 0x2ecc71,
    shininess: 10,
  }),
  pot: new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 20,
  }),
  laptop: {
    body: new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 60,
    }),
    screen: new THREE.MeshPhongMaterial({
      color: 0x222222,
      shininess: 100,
      emissive: 0x34495e,
      emissiveIntensity: 0.2,
    }),
    keyboard: new THREE.MeshPhongMaterial({
      color: 0x444444,
      shininess: 30,
    })
  },
  chart: new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 5,
  })
};

// Add office equipment materials
const officeMaterials = {
  printer: new THREE.MeshPhongMaterial({
    color: 0x2c3e50,
    shininess: 30,
  }),
  screen: new THREE.MeshPhongMaterial({
    color: 0x34495e,
    shininess: 100,
    emissive: 0x34495e,
    emissiveIntensity: 0.2,
  }),
  metal: new THREE.MeshPhongMaterial({
    color: 0xbdc3c7,
    shininess: 80,
  }),
  shelf: new THREE.MeshPhongMaterial({
    color: 0x95a5a6,
    shininess: 30,
  })
};

// Add font loader reference
const fontLoader = new FontLoader();
let cachedFont: Font | null = null;

// Load font once and cache it
const loadFont = (): Promise<Font> => {
  return new Promise<Font>((resolve, reject) => {
    if (cachedFont) {
      resolve(cachedFont);
      return;
    }
    
    fontLoader.load(
      '/fonts/helvetiker_regular.typeface.json',
      (font) => {
        cachedFont = font;
        resolve(font);
      },
      // Progress callback
      (xhr) => {
        console.log(`${(xhr.loaded / xhr.total * 100)}% loaded`);
      },
      // Error callback
      (error) => {
        console.error('Error loading font:', error);
        reject(error);
      }
    );
  });
};

// Create laptop function
const createLaptop = (isOpen: boolean) => {
  const laptopGroup = new THREE.Group();

  // Base/keyboard part (increased size)
  const baseGeometry = new THREE.BoxGeometry(1.2, 0.08, 0.8);
  const base = new THREE.Mesh(baseGeometry, decorMaterials.laptop.body);
  base.castShadow = true;
  laptopGroup.add(base);

  // Keyboard detail
  const keyboardGeometry = new THREE.PlaneGeometry(1.1, 0.7);
  const keyboard = new THREE.Mesh(keyboardGeometry, decorMaterials.laptop.keyboard);
  keyboard.rotation.x = -Math.PI / 2;
  keyboard.position.set(0, 0.041, -0.02);
  laptopGroup.add(keyboard);

  // Screen part (increased size)
  const screenGeometry = new THREE.BoxGeometry(1.18, 0.8, 0.03);
  const screen = new THREE.Mesh(screenGeometry, decorMaterials.laptop.body);
  
  // Screen display
  const displayGeometry = new THREE.PlaneGeometry(1.1, 0.7);
  const display = new THREE.Mesh(displayGeometry, decorMaterials.laptop.screen);
  display.position.z = 0.016;
  screen.add(display);

  if (isOpen) {
    screen.position.set(0, 0.4, -0.4);
    screen.rotation.x = -Math.PI / 6; // Angle when open
  } else {
    screen.position.set(0, 0.04, -0.4);
    screen.rotation.x = 0; // Closed
  }
  screen.castShadow = true;
  laptopGroup.add(screen);

  // Lift the entire laptop group slightly above the table
  laptopGroup.position.y = 0.02;

  return laptopGroup;
};

// Update createDecorations function
const createDecorations = () => {
  const decorGroup = new THREE.Group();

  // Create plants
  const createPlant = (x: number, z: number) => {
    const plantGroup = new THREE.Group();
    
    // Plant pot
    const potGeometry = new THREE.CylinderGeometry(0.3, 0.2, 0.4, 8);
    const pot = new THREE.Mesh(potGeometry, decorMaterials.pot);
    pot.position.set(0, 0.2, 0);
    pot.castShadow = true;
    plantGroup.add(pot);

    // Plant leaves (simplified)
    const leafGeometry = new THREE.SphereGeometry(0.4, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const leaves = new THREE.Mesh(leafGeometry, decorMaterials.plant);
    leaves.position.set(0, 0.5, 0);
    leaves.castShadow = true;
    plantGroup.add(leaves);

    plantGroup.position.set(x, 0, z);
    return plantGroup;
  };

  // Add plants at corners
  decorGroup.add(createPlant(-14, -14));
  decorGroup.add(createPlant(-14, 14));
  decorGroup.add(createPlant(14, -14));

  // Create wall chart
  const chartGeometry = new THREE.PlaneGeometry(4, 3);
  const chart = new THREE.Mesh(chartGeometry, decorMaterials.chart);
  chart.position.set(-14, 8, -5);
  chart.rotation.y = Math.PI / 2;
  decorGroup.add(chart);

  // Create bar chart lines (simplified)
  const createChartBar = (x: number, height: number) => {
    const barGeometry = new THREE.BoxGeometry(0.2, height, 0.1);
    const bar = new THREE.Mesh(barGeometry, new THREE.MeshPhongMaterial({ color: 0x3498db }));
    bar.position.set(x, height/2, 0.1);
    return bar;
  };

  // Add bars to chart
  const bars = [1.5, 1.0, 2.0, 1.2, 1.8];
  bars.forEach((height, i) => {
    const bar = createChartBar(-1.5 + i * 0.8, height);
    chart.add(bar);
  });

  return decorGroup;
};

// Create printer function
const createPrinter = () => {
  const printerGroup = new THREE.Group();

  // Main body
  const bodyGeometry = new THREE.BoxGeometry(1.2, 1.0, 0.8);
  const body = new THREE.Mesh(bodyGeometry, officeMaterials.printer);
  body.castShadow = true;
  printerGroup.add(body);

  // Paper tray
  const trayGeometry = new THREE.BoxGeometry(1.0, 0.05, 0.6);
  const tray = new THREE.Mesh(trayGeometry, officeMaterials.printer);
  tray.position.set(0, -0.4, 0.1);
  tray.castShadow = true;
  printerGroup.add(tray);

  // Control panel
  const panelGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.1);
  const panel = new THREE.Mesh(panelGeometry, officeMaterials.screen);
  panel.position.set(0.3, 0.4, 0.35);
  panel.rotation.x = -Math.PI / 6;
  printerGroup.add(panel);

  return printerGroup;
};

// Create water cooler function
const createWaterCooler = () => {
  const coolerGroup = new THREE.Group();

  // Water bottle (inverted)
  const bottleGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.5, 8);
  const bottle = new THREE.Mesh(bottleGeometry, new THREE.MeshPhongMaterial({
    color: 0x85c1e9,
    transparent: true,
    opacity: 0.6,
  }));
  bottle.position.y = 1.2;
  bottle.castShadow = true;
  coolerGroup.add(bottle);

  // Main unit
  const unitGeometry = new THREE.BoxGeometry(0.5, 1.0, 0.5);
  const unit = new THREE.Mesh(unitGeometry, officeMaterials.metal);
  unit.position.y = 0.5;
  unit.castShadow = true;
  coolerGroup.add(unit);

  // Taps
  const tapGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8);
  const tap1 = new THREE.Mesh(tapGeometry, officeMaterials.metal);
  tap1.position.set(0, 0.7, 0.25);
  tap1.rotation.x = Math.PI / 2;
  coolerGroup.add(tap1);

  const tap2 = new THREE.Mesh(tapGeometry, officeMaterials.metal);
  tap2.position.set(0, 0.4, 0.25);
  tap2.rotation.x = Math.PI / 2;
  coolerGroup.add(tap2);

  return coolerGroup;
};

// Create bookshelf function
const createBookshelf = () => {
  const shelfGroup = new THREE.Group();

  // Main frame
  const frameGeometry = new THREE.BoxGeometry(2, 2.5, 0.4);
  const frame = new THREE.Mesh(frameGeometry, officeMaterials.shelf);
  frame.castShadow = true;
  shelfGroup.add(frame);

  // Shelves
  for (let i = 0; i < 4; i++) {
    const shelfGeometry = new THREE.BoxGeometry(2, 0.05, 0.4);
    const shelf = new THREE.Mesh(shelfGeometry, officeMaterials.shelf);
    shelf.position.y = -1 + i * 0.6;
    shelf.castShadow = true;
    shelfGroup.add(shelf);

    // Add some books
    const numBooks = Math.floor(Math.random() * 5) + 3;
    for (let j = 0; j < numBooks; j++) {
      const bookGeometry = new THREE.BoxGeometry(0.1, 0.25, 0.3);
      const bookMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        shininess: 20,
      });
      const book = new THREE.Mesh(bookGeometry, bookMaterial);
      book.position.set(-0.9 + j * 0.2, -0.85 + i * 0.6, 0);
      book.castShadow = true;
      shelfGroup.add(book);
    }
  }

  return shelfGroup;
};

// Update createRoom function
const createRoom = () => {
  const roomGroup = new THREE.Group();
  const roomSize = { width: 30, height: 15, depth: 30 };

  // Create floor with thickness
  const floorGeometry = new THREE.BoxGeometry(roomSize.width, 0.2, roomSize.depth);
  const floor = new THREE.Mesh(floorGeometry, roomMaterials.floor);
  floor.position.y = -0.1; // Half the floor thickness
  floor.receiveShadow = true;
  roomGroup.add(floor);

  // Create walls with thickness
  const wallThickness = 0.3;
  
  // Back wall
  const backWallGeometry = new THREE.BoxGeometry(roomSize.width, roomSize.height, wallThickness);
  const backWall = new THREE.Mesh(backWallGeometry, roomMaterials.walls);
  backWall.position.set(0, roomSize.height/2, -roomSize.depth/2);
  backWall.receiveShadow = true;
  roomGroup.add(backWall);

  // Left wall
  const leftWallGeometry = new THREE.BoxGeometry(wallThickness, roomSize.height, roomSize.depth);
  const leftWall = new THREE.Mesh(leftWallGeometry, roomMaterials.walls);
  leftWall.position.set(-roomSize.width/2, roomSize.height/2, 0);
  leftWall.receiveShadow = true;
  roomGroup.add(leftWall);

  // Add office equipment
  // Printer corner
  const printer = createPrinter();
  printer.position.set(-13, 0, -13);
  printer.rotation.y = Math.PI / 4;
  roomGroup.add(printer);

  // Water cooler
  const waterCooler = createWaterCooler();
  waterCooler.position.set(-14, 0, 5);
  roomGroup.add(waterCooler);

  // Bookshelves along the wall
  const bookshelf1 = createBookshelf();
  bookshelf1.position.set(-14.8, 1.25, -8);
  roomGroup.add(bookshelf1);

  const bookshelf2 = createBookshelf();
  bookshelf2.position.set(-14.8, 1.25, 8);
  roomGroup.add(bookshelf2);

  // Add decorations
  const decorations = createDecorations();
  roomGroup.add(decorations);

  // Add wall logo
  const wallLogo = createWallLogo();
  roomGroup.add(wallLogo);

  return roomGroup;
};

// Create wall logo function
const createWallLogo = () => {
  const logoGroup = new THREE.Group();
  
  // Create a simple SW logo using basic shapes
  const logoGeometry = new THREE.PlaneGeometry(4, 2);
  const logoMaterial = new THREE.MeshPhongMaterial({
    color: 0x333333,
    emissive: 0x222222,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.9,
  });
  
  const logo = new THREE.Mesh(logoGeometry, logoMaterial);
  logo.position.set(0, 8, -14.9); // Position high on the back wall
  logoGroup.add(logo);
  
  return logoGroup;
};

export const VirtualOffice: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const chairsRef = useRef<Map<string, Chair>>(new Map());
  
  const { data: teamData, loading } = useQuery(TEAM_USERS_QUERY, {
    pollInterval: 5000,
  });

  const createChair = async (userName: string) => {
    const chairGroup = new THREE.Group();

    // Increased dimensions for all parts
    // Seat cushion
    const seatGeometry = new THREE.BoxGeometry(1.6, 0.2, 1.6);
    const seatCushion = new THREE.Mesh(seatGeometry, chairMaterials.fabric);
    seatCushion.position.y = 1.4;
    seatCushion.castShadow = true;
    chairGroup.add(seatCushion);

    // Backrest cushion with curved shape
    const backrestGeometry = new THREE.BoxGeometry(1.6, 2.0, 0.2);
    const backrestCushion = new THREE.Mesh(backrestGeometry, chairMaterials.fabric);
    backrestCushion.position.set(0, 2.4, -0.7);
    backrestCushion.castShadow = true;
    chairGroup.add(backrestCushion);

    // Chair base (5-star base)
    const baseRadius = 1.2;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5;
      const legGeometry = new THREE.BoxGeometry(0.2, 0.15, baseRadius);
      const leg = new THREE.Mesh(legGeometry, chairMaterials.plastic);
      leg.position.set(
        Math.sin(angle) * (baseRadius / 2),
        0.075,
        Math.cos(angle) * (baseRadius / 2)
      );
      leg.rotation.y = angle;
      leg.castShadow = true;
      chairGroup.add(leg);

      // Add wheels
      const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.15, 12);
      const wheel = new THREE.Mesh(wheelGeometry, chairMaterials.plastic);
      wheel.position.set(
        Math.sin(angle) * baseRadius,
        0.15,
        Math.cos(angle) * baseRadius
      );
      wheel.rotation.x = Math.PI / 2;
      wheel.castShadow = true;
      chairGroup.add(wheel);
    }

    // Central column
    const columnGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.3, 12);
    const column = new THREE.Mesh(columnGeometry, chairMaterials.metal);
    column.position.y = 0.75;
    column.castShadow = true;
    chairGroup.add(column);

    // Armrests
    const createArmrest = (x: number) => {
      // Vertical part
      const verticalGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.15);
      const vertical = new THREE.Mesh(verticalGeometry, chairMaterials.metal);
      vertical.position.set(x, 1.6, -0.2);
      vertical.castShadow = true;
      chairGroup.add(vertical);

      // Horizontal part
      const horizontalGeometry = new THREE.BoxGeometry(0.35, 0.15, 0.8);
      const horizontal = new THREE.Mesh(horizontalGeometry, chairMaterials.plastic);
      horizontal.position.set(x, 1.85, 0);
      horizontal.castShadow = true;
      chairGroup.add(horizontal);
    };

    createArmrest(0.85);  // Right armrest
    createArmrest(-0.85); // Left armrest

    // Add subtle tilt to the backrest
    backrestCushion.rotation.x = -0.1;

    try {
      // Add name text to the back of the chair
      const font = await loadFont();
      const textGeometry = new TextGeometry(userName.split(' ')[0], {
        font: font,
        size: 0.25,
        depth: 0.05,
        curveSegments: 12,
        bevelEnabled: false
      });
      
      // Center the text geometry
      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x;
      const textMesh = new THREE.Mesh(textGeometry, chairMaterials.text);
      
      // Create a container group for centering
      const textContainer = new THREE.Group();
      textMesh.position.x = -textWidth / 2;  // Center within container
      textContainer.add(textMesh);
      
      // Position the container in the middle of the backrest
      textContainer.position.set(0, 2.2, -0.82);
      textContainer.rotation.y = Math.PI;
      
      // Add a backing plate for better visibility
      const backingGeometry = new THREE.BoxGeometry(textWidth + 0.2, 0.4, 0.02);
      const backingMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        shininess: 0
      });
      const backingPlate = new THREE.Mesh(backingGeometry, backingMaterial);
      backingPlate.position.z = 0.01;  // Slightly behind the text
      textContainer.add(backingPlate);
      
      chairGroup.add(textContainer);
    } catch (error) {
      console.error('Failed to add name text to chair:', error);
    }

    return chairGroup;
  };

  const createTable = () => {
    const tableGroup = new THREE.Group();

    // Create table top with rounded corners using shape
    const shape = new THREE.Shape();
    const width = 16;  // Increased length for more seating
    const depth = 4;   // Slightly wider for comfort
    const radius = 0.1;  // Subtle corner radius

    // Draw rounded rectangle for table top (in the XZ plane instead of XY)
    shape.moveTo(-width/2 + radius, -depth/2);
    shape.lineTo(width/2 - radius, -depth/2);
    shape.quadraticCurveTo(width/2, -depth/2, width/2, -depth/2 + radius);
    shape.lineTo(width/2, depth/2 - radius);
    shape.quadraticCurveTo(width/2, depth/2, width/2 - radius, depth/2);
    shape.lineTo(-width/2 + radius, depth/2);
    shape.quadraticCurveTo(-width/2, depth/2, -width/2, depth/2 - radius);
    shape.lineTo(-width/2, -depth/2 + radius);
    shape.quadraticCurveTo(-width/2, -depth/2, -width/2 + radius, -depth/2);

    // Make the table top thick and solid
    const extrudeSettings = {
      steps: 1,
      depth: 0.15,  // Thicker table top
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 3
    };

    // Create the table top
    const tableTopGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const tableTop = new THREE.Mesh(tableTopGeometry, tableMaterials.wood);
    
    // Rotate to make it horizontal instead of vertical
    tableTop.rotation.x = -Math.PI / 2;
    
    // Adjust the Y position to standard table height
    tableTop.position.y = 1.4;
    
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // Create U-shaped legs
    const createULeg = (xPos: number) => {
      const legGroup = new THREE.Group();
      
      // Vertical supports
      const verticalLegGeometry = new THREE.BoxGeometry(0.1, 1.4, 0.1);
      const frontLeg = new THREE.Mesh(verticalLegGeometry, tableMaterials.legs);
      const backLeg = new THREE.Mesh(verticalLegGeometry, tableMaterials.legs);
      frontLeg.position.set(0, 0.7, -depth/2 + 0.2);
      backLeg.position.set(0, 0.7, depth/2 - 0.2);
      legGroup.add(frontLeg);
      legGroup.add(backLeg);

      // Horizontal support connecting the legs
      const horizontalLegGeometry = new THREE.BoxGeometry(0.1, 0.1, depth - 0.4);
      const horizontalSupport = new THREE.Mesh(horizontalLegGeometry, tableMaterials.legs);
      horizontalSupport.position.set(0, 0.1, 0);
      legGroup.add(horizontalSupport);

      legGroup.position.x = xPos;
      legGroup.castShadow = true;
      return legGroup;
    };

    // Add two U-shaped legs
    const leg1 = createULeg(-width/2 + 1);
    const leg2 = createULeg(width/2 - 1);
    tableGroup.add(leg1);
    tableGroup.add(leg2);

    // Add central support beam
    const supportBeamGeometry = new THREE.BoxGeometry(width - 2.2, 0.1, 0.2);
    const supportBeam = new THREE.Mesh(supportBeamGeometry, tableMaterials.legs);
    supportBeam.position.set(0, 0.1, 0);
    tableGroup.add(supportBeam);

    return tableGroup;
  };

  const cleanupChairs = () => {
    if (sceneRef.current) {
      // Remove all existing chairs from the scene
      chairsRef.current.forEach(chair => {
        sceneRef.current?.remove(chair.mesh);
      });
      chairsRef.current.clear();
    }
  };

  const updateChairPositions = async () => {
    if (!teamData?.getUsers || !sceneRef.current) return;

    console.log('Updating chair positions for users:', teamData.getUsers);
    
    const users = teamData.getUsers;
    const spacing = 3; // Spacing between chairs
    const tableWidth = 16; // Match the table width
    
    // Separate active and inactive users
    const activeUsers = users.filter(user => user.activeSession);
    const inactiveUsers = users.filter(user => !user.activeSession);
    
    const chairsPerSide = Math.ceil(activeUsers.length / 2); // Split active chairs between two sides
    
    // Clear existing laptops and labels
    sceneRef.current.children
      .filter(child => child.name === 'laptop' || child.name === 'chairLabel')
      .forEach(item => sceneRef.current?.remove(item));
    
    // Create text label for chair
    const createChairLabel = (userName: string): Promise<THREE.Group> => {
      const labelGroup = new THREE.Group();
      labelGroup.name = 'chairLabel';
      
      // Background plane
      const bgGeometry = new THREE.PlaneGeometry(2, 0.6);
      const bgMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        opacity: 0.8,
        transparent: true,
      });
      const background = new THREE.Mesh(bgGeometry, bgMaterial);
      labelGroup.add(background);
      
      // Text
      const textMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        shininess: 30,
      });
      
      return new Promise<THREE.Group>((resolve) => {
        loadFont().then(font => {
          try {
            const textGeometry = new TextGeometry(userName, {
              font: font,
              size: 0.25,
              depth: 0.02,
              curveSegments: 12,
              bevelEnabled: false,
            });
            
            textGeometry.computeBoundingBox();
            const textWidth = textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x;
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(-textWidth / 2, -0.15, 0.01);
            labelGroup.add(textMesh);
            resolve(labelGroup);
          } catch (error) {
            console.error('Failed to create chair label:', error);
            resolve(labelGroup); // Resolve with just the background if text fails
          }
        });
      });
    };

    // Position active users around the table
    for (const user of activeUsers) {
      let chair = chairsRef.current.get(user.id);

      if (!chair) {
        const chairMesh = await createChair(user.name);
        if (sceneRef.current && chairMesh) {
          console.log('Creating new chair for user:', user.name);
          sceneRef.current.add(chairMesh);
          chair = {
            mesh: chairMesh,
            targetPosition: new THREE.Vector3(),
            userId: user.id,
            isActive: true
          };
          chairsRef.current.set(user.id, chair);
        }
      }

      if (chair) {
        const isFirstSide = activeUsers.indexOf(user) < chairsPerSide;
        const sideIndex = isFirstSide ? activeUsers.indexOf(user) : activeUsers.indexOf(user) - chairsPerSide;
        const totalInThisSide = isFirstSide 
          ? Math.min(chairsPerSide, activeUsers.length)
          : Math.min(chairsPerSide, Math.max(0, activeUsers.length - chairsPerSide));

        // Calculate total width needed for chairs on this side
        const totalWidth = (totalInThisSide - 1) * spacing;
        
        // Center the chairs by starting from half the total width
        const startX = -totalWidth / 2;
        const xPosition = startX + (sideIndex * spacing);
        const zPosition = isFirstSide ? -2.5 : 2.5;
        
        // Rotate chairs to face the table
        chair.mesh.rotation.y = isFirstSide ? 0 : Math.PI;
        
        // Position chair
        chair.mesh.position.set(xPosition, 0, zPosition);

        // Add laptop
        const laptop = createLaptop(true);
        laptop.name = 'laptop';
        
        laptop.position.set(
          xPosition,
          1.55,
          isFirstSide ? -1.0 : 1.0
        );
        
        laptop.rotation.y = isFirstSide ? Math.PI : 0;
        sceneRef.current.add(laptop);

        // Add floating label in front of chair
        const label = await createChairLabel(user.name);
        label.position.set(xPosition, 3, zPosition + (isFirstSide ? 1 : -1));
        label.rotation.x = -Math.PI / 6;
        sceneRef.current.add(label);

        // Update chair color to active
        chair.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && 
              child.material instanceof THREE.MeshPhongMaterial) {
            const isFabricPart = child.material.color.getHex() === chairMaterials.fabric.color.getHex();
            if (isFabricPart) {
              child.material = child.material.clone();
              child.material.color.setHex(0x2E7D32);
            }
          }
        });
      }
    }

    // Position inactive users along the wall
    for (const user of inactiveUsers) {
      let chair = chairsRef.current.get(user.id);

      if (!chair) {
        const chairMesh = await createChair(user.name);
        if (sceneRef.current && chairMesh) {
          console.log('Creating new chair for user:', user.name);
          sceneRef.current.add(chairMesh);
          chair = {
            mesh: chairMesh,
            targetPosition: new THREE.Vector3(),
            userId: user.id,
            isActive: false
          };
          chairsRef.current.set(user.id, chair);
        }
      }

      if (chair) {
        const wallSpacing = 4; // Spacing between chairs along the wall
        const index = inactiveUsers.indexOf(user);
        const xPosition = -14; // Along the left wall
        const zPosition = -12 + (index * wallSpacing); // Spaced along the wall
        
        // Rotate chairs to face into the room
        chair.mesh.rotation.y = Math.PI / 2;
        
        // Position chair
        chair.mesh.position.set(xPosition, 0, zPosition);

        // Add floating label in front of chair
        const label = await createChairLabel(user.name);
        label.position.set(xPosition + 1, 3, zPosition);
        label.rotation.x = -Math.PI / 6;
        label.rotation.y = Math.PI / 2;
        sceneRef.current.add(label);

        // Update chair color to inactive
        chair.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && 
              child.material instanceof THREE.MeshPhongMaterial) {
            const isFabricPart = child.material.color.getHex() === chairMaterials.fabric.color.getHex();
            if (isFabricPart) {
              child.material = child.material.clone();
              child.material.color.setHex(0x9E9E9E);
            }
          }
        });
      }
    }
  };

  const setupScene = async () => {
    console.log('Setting up scene with data:', teamData);
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(
      50, // Reduced FOV for more isometric feel
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
    });
    
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Setup renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Brighter ambient light
    scene.add(ambientLight);

    // Main directional light (sunlight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);

    // Add fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // Add room
    const room = createRoom();
    scene.add(room);

    // Add conference table - centered in the room
    const conferenceTable = createTable();
    conferenceTable.position.set(0, 0, 0);
    scene.add(conferenceTable);

    // Set camera for isometric-like view
    camera.position.set(30, 20, 30);
    camera.lookAt(0, 0, 0);

    // Add controls with isometric-like constraints but no zoom limits
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.5; // Limit how low the camera can go
    controls.minPolarAngle = Math.PI / 4;   // Limit how high the camera can go
    controls.minDistance = 5;  // Allow closer zoom
    controls.maxDistance = 200; // Allow further zoom
    controls.target.set(0, 5, 0);
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 1.0;
    
    // Restrict camera rotation to prevent seeing behind walls
    controls.minAzimuthAngle = -Math.PI / 2; // Limit rotation to -90 degrees
    controls.maxAzimuthAngle = Math.PI / 2;  // Limit rotation to 90 degrees

    // Update user blocks
    await updateChairPositions();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return handleResize;  // Return for cleanup
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (!loading && teamData?.getUsers) {
      console.log('Data loaded, setting up scene');
      setupScene().then((cleanupFn) => {
        if (cleanupFn) cleanup = cleanupFn;
      });
    }

    return () => {
      if (cleanup) cleanup();
      if (containerRef.current && rendererRef.current?.domElement) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (sceneRef.current) {
        cleanupChairs();
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [loading, teamData]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Container ref={containerRef} />
      <BackButton onClick={() => navigate('/')}>
        <IoArrowBack /> Back to Dashboard
      </BackButton>
      <ControlPanel>
        <h3>Team Members</h3>
        {teamData?.getUsers?.map((user: any) => (
          <div key={user.id}>
            {user.name} - {user.activeSession ? 'Working' : 'Offline'}
            {user.activeSession?.project && ` on ${user.activeSession.project.name}`}
          </div>
        ))}
      </ControlPanel>
    </>
  );
}; 