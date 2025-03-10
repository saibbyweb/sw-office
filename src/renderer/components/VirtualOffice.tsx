import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import styled from 'styled-components';
import { useQuery } from '@apollo/client';
import { TEAM_USERS_QUERY, ME } from '../../graphql/queries';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoVideocam } from 'react-icons/io5';
import { TextureLoader } from 'three';
import { Users, Edit2 } from 'react-feather';
import { Button } from '../components/common';
import { ProfileEdit } from '../../components/ProfileEdit';
import appIcon from '../../assets/icon.png';
import { API_HOST } from '../../services/env';
import { theme } from '../styles/theme';
import { useCall } from '../../components/CallProvider';
import { toast } from 'react-hot-toast';
import { ConnectedUsersList } from '../../components/ConnectedUsersList';

const Container = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  background-color: ${props => props.theme.colors.background};
  overflow: hidden;

  & > * {
    position: relative;
    z-index: 1;
  }
`;

const MainLayout = styled.div`
  display: flex;
  height: calc(100vh - 80px);  // Subtract header height
  margin-top: 80px;  // Height of header
`;

const Sidebar = styled.div`
  width: 260px;
  height: 100%;
  background: ${props => props.theme.colors.primary}10;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 0;
  overflow-y: auto;
  flex-shrink: 0;
  z-index: 10;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
`;

const SidebarHeader = styled.div`
  padding: 0 16px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
`;

const MemberList = styled.div`
  padding: 0 8px;
`;

const MemberItem = styled.button<{ isActive: boolean; isSpotlighted: boolean; isOnBreak: boolean }>`
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: ${props => props.isSpotlighted ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  color: ${props => {
    if (props.isOnBreak) return '#f97316'; // Orange color for break
    if (props.isActive) return '#2E7D32';
    return '#9e9e9e';
  }};
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const StatusDot = styled.div<{ isActive: boolean; isOnBreak: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    if (props.isOnBreak) return '#f97316'; // Orange for break
    if (props.isActive) return '#2E7D32';  // Green for active
    return '#9e9e9e';                      // Gray for inactive
  }};
`;

const MainContent = styled.div`
  flex: 1;
  position: relative;
`;

const SpotlightControls = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  display: flex;
  gap: 10px;
`;

const Header = styled.header`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: 20px;
  z-index: 20;
  background: ${props => props.theme.colors.primary}15;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${props => props.theme.colors.primary}20;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
`;

const UserAvatar = styled.img`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${props => props.theme.colors.primary}40;
  display: none; /* Hide the avatar */
`;

const AppLogo = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-right: auto;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const TeamsButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}30;
  }
`;

const ProfileButton = styled.button`
  display: none; /* Hide the profile edit button */
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}30;
  }
`;

const BackButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.theme.colors.primary}20;
  border: none;
  border-radius: 8px;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
  margin-right: 1rem;
  
  &:hover {
    background: ${props => props.theme.colors.primary}30;
  }
`;

const CallButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  margin-left: auto;

  &:hover {
    background: ${props => props.theme.colors.primary}20;
  }

  &:active {
    transform: scale(0.95);
  }
`;

interface Break {
  id: string;
  endTime: string | null;
}

interface User {
  id: string;
  name: string;
  activeSession: {
    id: string;
    breaks?: Break[];
    project?: {
      name: string;
    };
  } | null;
  email?: string;
  avatarUrl?: string;
}

interface Chair {
  mesh: THREE.Group;
  targetPosition: THREE.Vector3;
  userId: string;
  isActive: boolean;
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
    bumpScale: 0.05,
    map: textureLoader.load('/textures/chair/fabric.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 3);
      texture.colorSpace = THREE.SRGBColorSpace;
    }),
    bumpMap: textureLoader.load('/textures/chair/fabric_bump.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 3);
    }),
    normalMap: textureLoader.load('/textures/chair/fabric_normal.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 3);
    })
  }),
  plastic: new THREE.MeshPhongMaterial({
    color: 0x222222,
    shininess: 40,
    specular: 0x333333,
    map: textureLoader.load('/textures/chair/plastic.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      texture.colorSpace = THREE.SRGBColorSpace;
    }),
    normalMap: textureLoader.load('/textures/chair/plastic_normal.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
    })
  }),
  text: new THREE.MeshPhongMaterial({
    color: 0xFFFFFF,
    shininess: 100,
    emissive: 0xFFFFFF,
    emissiveIntensity: 0.2,
  })
};

// Table materials
const tableMaterials = {
  wood: new THREE.MeshPhongMaterial({
    map: textureLoader.load('/textures/floor.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(0.5, 0.5);
      texture.colorSpace = THREE.SRGBColorSpace;
    }),
    shininess: 40,
    specular: 0x444444,
  }),
  legs: new THREE.MeshPhongMaterial({
    color: 0x1a1a1a,
    shininess: 30,
    specular: 0x222222,
  })
};

// Room materials
const roomMaterials = {
  floorLight: new THREE.MeshPhongMaterial({
    color: 0x64748b,
    shininess: 30,
    specular: 0x222222,
  }),
  floorDark: new THREE.MeshPhongMaterial({
    color: 0x475569, // Slightly darker shade for contrast
    shininess: 30,
    specular: 0x222222,
  }),
  floorSide: new THREE.MeshPhongMaterial({
    color: 0x475569, // Matching shade for sides
    shininess: 20,
    specular: 0x111111,
  })
};

// Laptop materials
const decorMaterials = {
  laptop: {
    body: new THREE.MeshPhongMaterial({
      color: 0x2c3e50,
      shininess: 100,
      specular: 0x444444,
    }),
    screen: new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      shininess: 100,
      emissive: 0x3498db,
      emissiveIntensity: 0.15,
    }),
    keyboard: new THREE.MeshPhongMaterial({
    color: 0x34495e,
      shininess: 60,
      specular: 0x666666,
    })
  }
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
  const baseGeometry = new THREE.BoxGeometry(3.0, 0.08, 1.8);  // Wider and deeper base
  const base = new THREE.Mesh(baseGeometry, decorMaterials.laptop.body);
  base.castShadow = true;
  laptopGroup.add(base);

  // Keyboard detail
  const keyboardGeometry = new THREE.PlaneGeometry(2.8, 1.7);  // Wider keyboard
  const keyboard = new THREE.Mesh(keyboardGeometry, decorMaterials.laptop.keyboard);
  keyboard.rotation.x = -Math.PI / 2;
  keyboard.position.set(0, 0.041, 0);
  laptopGroup.add(keyboard);

  // Screen part (increased size significantly)
  const screenGeometry = new THREE.BoxGeometry(3.0, 2.2, 0.05);  // Much wider and taller screen
  const screen = new THREE.Mesh(screenGeometry, decorMaterials.laptop.body);
  
  // Screen display
  const displayGeometry = new THREE.PlaneGeometry(2.9, 2.1);  // Larger display area
  const display = new THREE.Mesh(displayGeometry, decorMaterials.laptop.screen);
  display.position.z = 0.026;
  screen.add(display);

  if (isOpen) {
    screen.position.set(0, 1.1, -0.85);  // Adjusted height and position for larger screen
    screen.rotation.x = -Math.PI / 6;    // Same angle for visibility
  } else {
    screen.position.set(0, 0.04, -0.85);
    screen.rotation.x = 0;
  }
  screen.castShadow = true;
  laptopGroup.add(screen);

  // Lift the entire laptop group slightly above the table
  laptopGroup.position.y = 0.01;  // Reduced the lift to prevent floating appearance

  return laptopGroup;
};

// Create room function
const createRoom = () => {
  const roomGroup = new THREE.Group();
  const roomSize = { width: 60, height: 15, depth: 60 }; // Increased from 40x40 to 60x60
  const tileSize = 2; // Keeping the same tile size
  const tileHeight = 0.2; // Keeping the same tile height
  const floorDepth = 0.4; // Keeping the same floor depth
  
  // Create floor with chess pattern
  const floorGroup = new THREE.Group();
  const tilesX = Math.ceil(roomSize.width / tileSize);
  const tilesZ = Math.ceil(roomSize.depth / tileSize);
  
  // Create base floor
  const baseFloorGeometry = new THREE.BoxGeometry(roomSize.width, floorDepth, roomSize.depth);
  const baseFloor = new THREE.Mesh(baseFloorGeometry, roomMaterials.floorSide);
  baseFloor.position.y = -floorDepth/2;
  baseFloor.receiveShadow = true;
  floorGroup.add(baseFloor);
  
  // Create individual tiles with depth
  for (let x = 0; x < tilesX; x++) {
    for (let z = 0; z < tilesZ; z++) {
      const isEven = (x + z) % 2 === 0;
      
      // Create tile with depth
      const tileGeometry = new THREE.BoxGeometry(tileSize * 0.95, tileHeight, tileSize * 0.95);
      const tile = new THREE.Mesh(
        tileGeometry,
        isEven ? roomMaterials.floorLight : roomMaterials.floorDark
      );
      
      // Position each tile
      tile.position.set(
        (x - tilesX/2) * tileSize + tileSize/2,
        0,
        (z - tilesZ/2) * tileSize + tileSize/2
      );
      
      tile.receiveShadow = true;
      tile.castShadow = true;
      floorGroup.add(tile);
    }
  }
  
  roomGroup.add(floorGroup);
  return roomGroup;
};

// Create table function
const createTable = () => {
  const tableGroup = new THREE.Group();

  // Create table top with rounded corners using shape
  const shape = new THREE.Shape();
  const width = 30;  // Increased from 20 to 30
  const depth = 8;   // Increased from 6 to 8
  const radius = 0.2;  // Slightly increased corner radius

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
  
  // Adjust the Y position to new table height
  tableTop.position.y = 1.8;  // Increased from 1.4
  
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  tableGroup.add(tableTop);

  // Create U-shaped legs
  const createULeg = (xPos: number) => {
    const legGroup = new THREE.Group();
    
    // Vertical supports
    const verticalLegGeometry = new THREE.BoxGeometry(0.15, 1.8, 0.15);  // Increased height and thickness
    const frontLeg = new THREE.Mesh(verticalLegGeometry, tableMaterials.legs);
    const backLeg = new THREE.Mesh(verticalLegGeometry, tableMaterials.legs);
    frontLeg.position.set(0, 0.9, -depth/2 + 0.2);  // Adjusted Y position
    backLeg.position.set(0, 0.9, depth/2 - 0.2);    // Adjusted Y position
    legGroup.add(frontLeg);
    legGroup.add(backLeg);

    // Horizontal support connecting the legs
    const horizontalLegGeometry = new THREE.BoxGeometry(0.15, 0.15, depth - 0.4);  // Increased thickness
    const horizontalSupport = new THREE.Mesh(horizontalLegGeometry, tableMaterials.legs);
    horizontalSupport.position.set(0, 0.15, 0);  // Adjusted Y position
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

// Create chair function
  const createChair = async (userName: string) => {
    const chairGroup = new THREE.Group();

  // Increased dimensions for more substantial look
  // Seat cushion - made thicker and wider
  const seatGeometry = new THREE.BoxGeometry(2.4, 0.4, 2.4);  // Increased width, depth and height
    const seatCushion = new THREE.Mesh(seatGeometry, chairMaterials.fabric);
    seatCushion.position.y = 1.4;
    seatCushion.castShadow = true;
    chairGroup.add(seatCushion);

  // Backrest cushion - made thicker and taller
  const backrestGeometry = new THREE.BoxGeometry(2.4, 2.6, 0.45);  // Increased width, height and thickness
    const backrestCushion = new THREE.Mesh(backrestGeometry, chairMaterials.fabric);
  backrestCushion.position.set(0, 2.7, -0.95);  // Adjusted position for larger size
    backrestCushion.castShadow = true;
    chairGroup.add(backrestCushion);

  // Chair base (5-star base) - made larger
  const baseRadius = 1.8;  // Increased from 1.5
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5;
    const legGeometry = new THREE.BoxGeometry(0.25, 0.18, baseRadius); // Thicker legs
      const leg = new THREE.Mesh(legGeometry, chairMaterials.plastic);
      leg.position.set(
        Math.sin(angle) * (baseRadius / 2),
      0.09,
        Math.cos(angle) * (baseRadius / 2)
      );
      leg.rotation.y = angle;
      leg.castShadow = true;
      chairGroup.add(leg);

    // Add larger wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.18, 12);
      const wheel = new THREE.Mesh(wheelGeometry, chairMaterials.plastic);
      wheel.position.set(
        Math.sin(angle) * baseRadius,
      0.18,
        Math.cos(angle) * baseRadius
      );
      wheel.rotation.x = Math.PI / 2;
      wheel.castShadow = true;
      chairGroup.add(wheel);
    }

  // Thicker central column
  const columnGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.3, 12);
    const column = new THREE.Mesh(columnGeometry, chairMaterials.metal);
    column.position.y = 0.75;
    column.castShadow = true;
    chairGroup.add(column);

  // Larger armrests
    const createArmrest = (x: number) => {
    // Vertical part - thicker
    const verticalGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.2);
      const vertical = new THREE.Mesh(verticalGeometry, chairMaterials.metal);
      vertical.position.set(x, 1.6, -0.2);
      vertical.castShadow = true;
      chairGroup.add(vertical);

    // Horizontal part - wider and thicker
    const horizontalGeometry = new THREE.BoxGeometry(0.45, 0.2, 1.0);
      const horizontal = new THREE.Mesh(horizontalGeometry, chairMaterials.plastic);
      horizontal.position.set(x, 1.85, 0);
      horizontal.castShadow = true;
      chairGroup.add(horizontal);
    };

  createArmrest(1.0);  // Moved slightly outward
  createArmrest(-1.0); // Moved slightly outward

    // Add subtle tilt to the backrest
  backrestCushion.rotation.x = -0.15; // Slightly more recline

    try {
      // Add name text to the back of the chair
      const font = await loadFont();
    const [firstName, ...lastNameParts] = userName.split(' ');
    const lastName = lastNameParts.join(' ');

    // Create first name text with smaller size
    const firstNameGeometry = new TextGeometry(firstName, {
        font: font,
      size: 0.2,
        depth: 0.05,
        curveSegments: 12,
        bevelEnabled: false
      });
      
    // Create last name text with smaller size
    const lastNameGeometry = new TextGeometry(lastName, {
      font: font,
      size: 0.2,
      depth: 0.05,
      curveSegments: 12,
      bevelEnabled: false
    });
    
    // Center both text geometries
    firstNameGeometry.computeBoundingBox();
    lastNameGeometry.computeBoundingBox();
    
    const firstNameWidth = firstNameGeometry.boundingBox!.max.x - firstNameGeometry.boundingBox!.min.x;
    const lastNameWidth = lastNameGeometry.boundingBox!.max.x - lastNameGeometry.boundingBox!.min.x;
    const maxWidth = Math.max(firstNameWidth, lastNameWidth);
    
    const firstNameMesh = new THREE.Mesh(firstNameGeometry, chairMaterials.text);
    const lastNameMesh = new THREE.Mesh(lastNameGeometry, chairMaterials.text);
      
      // Create a container group for centering
      const textContainer = new THREE.Group();
    
    // Position first name
    firstNameMesh.position.x = -firstNameWidth / 2;
    firstNameMesh.position.y = 0.3;
    textContainer.add(firstNameMesh);
    
    // Position last name
    lastNameMesh.position.x = -lastNameWidth / 2;
    lastNameMesh.position.y = -0.1;
    textContainer.add(lastNameMesh);
      
      // Position the container in the middle of the backrest
    // Move it slightly forward and up
    textContainer.position.set(0, 2.4, -1.15);
      textContainer.rotation.y = Math.PI;
    textContainer.rotation.x = -0.15;
      
      // Add a backing plate for better visibility
    const backingGeometry = new THREE.BoxGeometry(maxWidth + 0.3, 0.8, 0.02);
      const backingMaterial = new THREE.MeshPhongMaterial({
      color: 0x222222,
      shininess: 0,
      transparent: true,
      opacity: 0.9
      });
      const backingPlate = new THREE.Mesh(backingGeometry, backingMaterial);
    backingPlate.position.z = 0.03; // Slightly behind the text
    backingPlate.position.y = 0.1; // Center between both names
      textContainer.add(backingPlate);
      
      chairGroup.add(textContainer);
    } catch (error) {
      console.error('Failed to add name text to chair:', error);
    }

    return chairGroup;
  };

export const VirtualOffice: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const chairsRef = useRef<Map<string, Chair>>(new Map());
  const controlsRef = useRef<OrbitControls | null>(null);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [spotlightedUser, setSpotlightedUser] = useState<string | null>(null);
  const spotlightRef = useRef<THREE.SpotLight | null>(null);
  const { initiateCall } = useCall();
  
  const { data: teamData, loading } = useQuery(TEAM_USERS_QUERY, {
    pollInterval: 5000,
  });

  const { data: userData } = useQuery(ME);

  const addChair = async (userName: string, userId: string, isActive: boolean) => {
    const chairMesh = await createChair(userName);
    if (sceneRef.current && chairMesh) {
      console.log('Creating new chair for user:', userName);
      sceneRef.current.add(chairMesh);
      const chair: Chair = {
        mesh: chairMesh,
        targetPosition: new THREE.Vector3(),
        userId: userId,
        isActive: isActive
      };
      chairsRef.current.set(userId, chair);
      return chair;
    }
    return null;
  };

  const addTable = () => {
    const tableGroup = createTable();
    if (sceneRef.current && tableGroup) {
      console.log('Creating conference table');
      sceneRef.current.add(tableGroup);
    return tableGroup;
    }
    return null;
  };

  const updateChairPositions = async () => {
    if (!teamData?.getUsers || !sceneRef.current) return;

    console.log('Updating chair positions for users:', teamData.getUsers);
    
    const users = teamData.getUsers;
    const spacing = 5;
    const tableWidth = 30;
    
    // Clear existing laptops, labels and project names
    sceneRef.current.children
      .filter(child => child.name === 'laptop' || child.name === 'chairLabel' || child.name === 'projectLabel' || child.name === 'breakLabel')
      .forEach(item => sceneRef.current?.remove(item));
    
    // Position all users around the table
    const totalUsers = users.length;
    const chairsPerSide = Math.ceil(totalUsers / 2);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      let chair = chairsRef.current.get(user.id);

      // Check if user is on break
      const isOnBreak = user.activeSession?.breaks?.some((breakItem: Break) => !breakItem.endTime);

      if (!chair) {
        const newChair = await addChair(user.name, user.id, !!user.activeSession);
        if (newChair) {
          chair = newChair;
        } else {
          continue;
        }
      }

      if (chair) {
        const isFirstSide = i < chairsPerSide;
        const sideIndex = isFirstSide ? i : i - chairsPerSide;
        const totalInThisSide = isFirstSide 
          ? Math.min(chairsPerSide, totalUsers)
          : Math.min(chairsPerSide, Math.max(0, totalUsers - chairsPerSide));

        // Calculate total width needed for chairs on this side
        const totalWidth = (totalInThisSide - 1) * spacing;
        
        // Center the chairs by starting from half the total width
        const startX = -totalWidth / 2;
        const xPosition = startX + (sideIndex * spacing);
        const zPosition = isFirstSide ? -4.5 : 4.5;
        
        // Rotate chairs to face the table
        chair.mesh.rotation.y = isFirstSide ? 0 : Math.PI;
        
        // Position chair
        chair.mesh.position.set(xPosition, 0, zPosition);

        // Add laptop and project name if user is active
        if (user.activeSession) {
        const laptop = createLaptop(true);
        laptop.name = 'laptop';
        
        laptop.position.set(
          xPosition,
            2,
            isFirstSide ? -2.2 : 2.2
        );
        
        laptop.rotation.y = isFirstSide ? Math.PI : 0;
        sceneRef.current.add(laptop);

          // Add "On Break" label if user is on break
          if (isOnBreak) {
            const breakLabelCanvas = document.createElement('canvas');
            const ctx = breakLabelCanvas.getContext('2d');
            if (ctx) {
              breakLabelCanvas.width = 256;
              breakLabelCanvas.height = 64;
              ctx.fillStyle = '#f97316'; // Orange color
              ctx.font = 'bold 24px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('On Break', 128, 32);

              const breakTexture = new THREE.CanvasTexture(breakLabelCanvas);
              const breakMaterial = new THREE.MeshBasicMaterial({
                map: breakTexture,
                transparent: true,
                side: THREE.DoubleSide
              });

              const breakGeometry = new THREE.PlaneGeometry(1.5, 0.4);
              const breakMesh = new THREE.Mesh(breakGeometry, breakMaterial);
              breakMesh.name = 'breakLabel';

              // Position above "Working on" text
              breakMesh.position.set(
                xPosition,
                3.8, // Higher than "Working on" text
                isFirstSide ? -2.2 : 2.2
              );
              breakMesh.rotation.y = isFirstSide ? Math.PI : 0;
              
              sceneRef.current.add(breakMesh);
            }
          }

          // Add project name if it exists
          if (user.activeSession.project?.name) {
            // Create "Working on" label
            const workingOnCanvas = document.createElement('canvas');
            const workingOnCtx = workingOnCanvas.getContext('2d');
            if (workingOnCtx) {
              workingOnCanvas.width = 256;
              workingOnCanvas.height = 64;
              workingOnCtx.fillStyle = '#ffffff';
              workingOnCtx.font = '20px Arial'; // Normal font weight
              workingOnCtx.textAlign = 'center';
              workingOnCtx.textBaseline = 'middle';
              workingOnCtx.fillText('Working on', 128, 32);

              const workingOnTexture = new THREE.CanvasTexture(workingOnCanvas);
              const workingOnMaterial = new THREE.MeshBasicMaterial({
                map: workingOnTexture,
                transparent: true,
                side: THREE.DoubleSide
              });

              const workingOnGeometry = new THREE.PlaneGeometry(1.5, 0.4);
              const workingOnMesh = new THREE.Mesh(workingOnGeometry, workingOnMaterial);
              workingOnMesh.name = 'projectLabel';

              // Position above laptop
              workingOnMesh.position.set(
                xPosition,
                3.4, // Slightly higher than project name
                isFirstSide ? -2.2 : 2.2
              );
              workingOnMesh.rotation.y = isFirstSide ? Math.PI : 0;
              
              sceneRef.current.add(workingOnMesh);
            }

            // Project name label
            const projectNameCanvas = document.createElement('canvas');
            const ctx = projectNameCanvas.getContext('2d');
            if (ctx) {
              projectNameCanvas.width = 256;
              projectNameCanvas.height = 64;
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 24px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(user.activeSession.project.name, 128, 32);

              const projectTexture = new THREE.CanvasTexture(projectNameCanvas);
              const projectMaterial = new THREE.MeshBasicMaterial({
                map: projectTexture,
                transparent: true,
                side: THREE.DoubleSide
              });

              const projectGeometry = new THREE.PlaneGeometry(2, 0.5);
              const projectMesh = new THREE.Mesh(projectGeometry, projectMaterial);
              projectMesh.name = 'projectLabel';

              // Position above laptop, below "Working on" text
              projectMesh.position.set(
                xPosition,
                3.0, // Below "Working on" text
                isFirstSide ? -2.2 : 2.2
              );
              projectMesh.rotation.y = isFirstSide ? Math.PI : 0;
              
              sceneRef.current.add(projectMesh);
            }
          }
        }

        // Update chair color based on active status and break status
        chair.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && 
              child.material instanceof THREE.MeshPhongMaterial) {
            const isFabricPart = child.material.color.getHex() === chairMaterials.fabric.color.getHex();
            if (isFabricPart) {
              child.material = child.material.clone();
              if (user.activeSession) {
                child.material.color.setHex(isOnBreak ? 0xf97316 : 0x2E7D32);
              } else {
                child.material.color.setHex(0x333333);
              }
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
    const mainScene = new THREE.Scene();
    
    // Set solid background color
    mainScene.background = new THREE.Color('#1e293b');
    
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
    });
    
    sceneRef.current = mainScene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Setup renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    mainScene.add(ambientLight);

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
    mainScene.add(directionalLight);

    // Add fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-10, 10, -10);
    mainScene.add(fillLight);

    // Add room
    const room = createRoom();
    mainScene.add(room);

    // Add conference table - centered in the room
    const table = addTable();
    if (table) {
      table.position.set(0, 0, 0);
      mainScene.add(table);
    }

    // Set camera for isometric-like view
    camera.position.set(30, 20, 30);
    camera.lookAt(0, 0, 0);

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 200;
    controls.target.set(0, 5, 0);
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 1.0;
    controlsRef.current = controls;

    // Update user blocks
    await updateChairPositions();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(mainScene, camera);
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

    return handleResize;
  };

  const handleMemberClick = (userId: string) => {
    if (spotlightedUser === userId) {
      setSpotlightedUser(null);
      if (spotlightRef.current && sceneRef.current) {
        sceneRef.current.remove(spotlightRef.current);
        spotlightRef.current = null;
      }
      
      // Reset camera to original position when removing spotlight
      if (cameraRef.current && controlsRef.current) {
        gsap.to(cameraRef.current.position, {
          x: 30,
          y: 20,
          z: 30,
          duration: 1,
          ease: "power2.inOut"
        });
        
        gsap.to(controlsRef.current.target, {
          x: 0,
          y: 5,
          z: 0,
          duration: 1,
          ease: "power2.inOut"
        });
      }
    } else {
      setSpotlightedUser(userId);
      const chair = chairsRef.current.get(userId);
      if (chair && sceneRef.current) {
        // Remove existing spotlight if any
        if (spotlightRef.current) {
          sceneRef.current.remove(spotlightRef.current);
        }

        // Create new spotlight with enhanced settings
        const spotlight = new THREE.SpotLight(0xffffff, 5);
        spotlight.position.set(
          chair.mesh.position.x,
          15,
          chair.mesh.position.z
        );
        spotlight.target = chair.mesh;
        spotlight.angle = Math.PI / 8;
        spotlight.penumbra = 0.2;
        spotlight.decay = 1.5;
        spotlight.distance = 25;
        spotlight.castShadow = true;

        // Enhanced shadow settings
        spotlight.shadow.mapSize.width = 1024;
        spotlight.shadow.mapSize.height = 1024;
        spotlight.shadow.camera.near = 1;
        spotlight.shadow.camera.far = 30;
        spotlight.shadow.focus = 1;

        // Add a slight color tint to make it more visible
        spotlight.color.setHSL(0, 0, 1);

        sceneRef.current.add(spotlight);
        spotlightRef.current = spotlight;

        // Animate the camera to look at the spotlighted chair
        if (cameraRef.current && controlsRef.current) {
          // Calculate camera position based on which side of the table the chair is on
          const isFirstSide = chair.mesh.position.z < 0;
          const previousChair = chairsRef.current.get(spotlightedUser || '');
          const isChangingSides = previousChair && 
            ((previousChair.mesh.position.z < 0 && !isFirstSide) || 
             (previousChair.mesh.position.z > 0 && isFirstSide));
          
          // Calculate final camera position
          const finalCameraPos = isFirstSide ? 
            { 
              x: chair.mesh.position.x,
              y: 6.5,
              z: chair.mesh.position.z - 6
            } : 
            { 
              x: chair.mesh.position.x,
              y: 6.5,
              z: chair.mesh.position.z + 6
            };

          if (isChangingSides && cameraRef.current) {
            // Create a smooth circular path for the camera
            const timeline = gsap.timeline();
            const radius = 20; // Wide radius for the arc
            const currentAngle = Math.atan2(cameraRef.current.position.z, cameraRef.current.position.x);
            const targetAngle = isFirstSide ? Math.PI : 0;
            
            // Single smooth animation along the arc
            timeline.to(cameraRef.current.position, {
              x: chair.mesh.position.x + radius * Math.cos(targetAngle),
              y: 8, // Peak height during transition
              z: radius * Math.sin(targetAngle),
              duration: 1.5,
              ease: "power2.inOut"
            }).to(cameraRef.current.position, {
              x: finalCameraPos.x,
              y: finalCameraPos.y,
              z: finalCameraPos.z,
              duration: 0.8,
              ease: "power2.inOut"
            });

            // Smooth target transition
            gsap.to(controlsRef.current.target, {
              x: chair.mesh.position.x,
              y: 2.1,
              z: isFirstSide ? chair.mesh.position.z - 0.2 : chair.mesh.position.z + 0.2,
              duration: timeline.duration(),
              ease: "power2.inOut"
            });
          } else {
            // Direct movement for same-side transitions
            gsap.to(cameraRef.current.position, {
              x: finalCameraPos.x,
              y: finalCameraPos.y,
              z: finalCameraPos.z,
              duration: 1.2,
              ease: "power2.inOut"
            });

            const targetZ = isFirstSide ? 
              chair.mesh.position.z - 0.2 : 
              chair.mesh.position.z + 0.2;

            gsap.to(controlsRef.current.target, {
              x: chair.mesh.position.x,
              y: 2.1,
              z: targetZ,
              duration: 1.2,
              ease: "power2.inOut"
            });
          }
        }
      }
    }
  };

  const removeSpotlight = () => {
    setSpotlightedUser(null);
    if (spotlightRef.current && sceneRef.current) {
      sceneRef.current.remove(spotlightRef.current);
      spotlightRef.current = null;
    }
  };

  const handleCallUser = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the member click
    try {
      await initiateCall(userId);
      toast.success("Initiating call...");
    } catch (error) {
      console.error("Failed to initiate call:", error);
      toast.error("Failed to initiate call. Please try again.");
    }
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (!loading && teamData?.getUsers) {
      console.log('Data loaded, setting up scene');
      setupScene().then((cleanupFn) => {
        if (cleanupFn) cleanup = cleanupFn;
        
        // Auto-focus on logged-in user's chair after scene setup
        if (userData?.me?.id) {
          const currentUserChair = chairsRef.current.get(userData.me.id);
          if (currentUserChair && cameraRef.current && controlsRef.current) {
            const isFirstSide = currentUserChair.mesh.position.z < 0;
            
            // Calculate camera position for the user's chair but more zoomed out
            const finalCameraPos = isFirstSide ? 
              { 
                x: currentUserChair.mesh.position.x,
                y: 15, // Higher up
                z: currentUserChair.mesh.position.z - 15 // Further back
              } : 
              { 
                x: currentUserChair.mesh.position.x,
                y: 15, // Higher up
                z: currentUserChair.mesh.position.z + 15 // Further back
              };

            // Animate camera to focus on user's chair
            gsap.to(cameraRef.current.position, {
              x: finalCameraPos.x,
              y: finalCameraPos.y,
              z: finalCameraPos.z,
              duration: 2, // Longer duration for smoother movement
              ease: "power2.inOut"
            });

            gsap.to(controlsRef.current.target, {
              x: currentUserChair.mesh.position.x,
              y: 2.1,
              z: isFirstSide ? currentUserChair.mesh.position.z - 0.2 : currentUserChair.mesh.position.z + 0.2,
              duration: 2,
              ease: "power2.inOut"
            });

            // Add marker above the user's chair
            const markerGeometry = new THREE.ConeGeometry(0.5, 1.0, 4);  // Increased size
            const markerMaterial = new THREE.MeshPhongMaterial({
              color: 0x22c55e,  // Changed to green
              emissive: 0x22c55e,  // Changed emissive to match
              emissiveIntensity: 0.5,
              transparent: true,
              opacity: 0.8
            });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            
            // Position marker above the chair and rotate it 180 degrees
            marker.position.set(
              currentUserChair.mesh.position.x,
              5.5, // Slightly higher position to account for larger size
              currentUserChair.mesh.position.z
            );
            marker.rotation.x = Math.PI;  // Rotate 180 degrees to invert
            
            // Add floating animation
            const floatAnimation = () => {
              gsap.to(marker.position, {
                y: 5.8, // Increased float range
                duration: 1.5,
                ease: "power1.inOut",
                yoyo: true,
                repeat: -1
              });
              gsap.to(marker.rotation, {
                y: Math.PI * 2,
                duration: 3,
                ease: "none",
                repeat: -1
              });
            };
            
            if (sceneRef.current) {
              marker.name = 'userMarker';
              sceneRef.current.add(marker);
              floatAnimation();
            }

            // Set spotlight on the user's chair
            setSpotlightedUser(userData.me.id);
            const spotlight = new THREE.SpotLight(0xffffff, 5);
            spotlight.position.set(
              currentUserChair.mesh.position.x,
              15,
              currentUserChair.mesh.position.z
            );
            spotlight.target = currentUserChair.mesh;
            spotlight.angle = Math.PI / 8;
            spotlight.penumbra = 0.2;
            spotlight.decay = 1.5;
            spotlight.distance = 25;
            spotlight.castShadow = true;
            spotlight.shadow.mapSize.width = 1024;
            spotlight.shadow.mapSize.height = 1024;
            spotlight.shadow.camera.near = 1;
            spotlight.shadow.camera.far = 30;
            spotlight.shadow.focus = 1;
            spotlight.color.setHSL(0, 0, 1);

            if (sceneRef.current) {
              sceneRef.current.add(spotlight);
              spotlightRef.current = spotlight;
            }
          }
        }
      });
    }

    return () => {
      if (cleanup) cleanup();
      if (containerRef.current && rendererRef.current?.domElement) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (sceneRef.current) {
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
  }, [loading, teamData, userData?.me?.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/')}>
          <IoArrowBack /> Back
        </BackButton>
        <AppLogo src={appIcon} alt="SW Office" />
        <HeaderActions>
          <TeamsButton onClick={() => navigate('/teams')}>
            <Users size={18} />
            Teams
          </TeamsButton>
          <UserInfo>
            <UserAvatar 
              src={userData?.me?.avatarUrl ? API_HOST + userData.me.avatarUrl : 'default-avatar.png'} 
              alt={userData?.me?.name || 'Profile'}
            />
            {userData?.me?.name} ({userData?.me?.email})
          </UserInfo>
          <ProfileButton onClick={() => setIsProfileEditOpen(true)}>
            <Edit2 size={18} />
            Edit Profile
          </ProfileButton>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/login')}
          >
            Logout
          </Button>
        </HeaderActions>
      </Header>
      <MainLayout>
        <Sidebar>
          <SidebarHeader>Team Members</SidebarHeader>
          <MemberList>
            {teamData?.getUsers?.map((user: User) => {
              const isOnBreak = user.activeSession?.breaks?.some((breakItem: Break) => !breakItem.endTime);
              return (
                <MemberItem
                  key={user.id}
                  isActive={!!user.activeSession}
                  isSpotlighted={spotlightedUser === user.id}
                  isOnBreak={!!isOnBreak}
                  onClick={() => handleMemberClick(user.id)}
                >
                  <StatusDot 
                    isActive={!!user.activeSession} 
                    isOnBreak={!!isOnBreak}
                  />
                  {user.name}
                  {user.id !== userData?.me?.id && (
                    <CallButton
                      onClick={(e) => handleCallUser(user.id, e)}
                      title="Start video call"
                    >
                      <IoVideocam size={18} />
                    </CallButton>
                  )}
                </MemberItem>
              );
            })}
          </MemberList>
          <ConnectedUsersList />
        </Sidebar>
        <MainContent>
          <SpotlightControls>
            {spotlightedUser && (
              <Button variant="secondary" onClick={removeSpotlight}>
                Remove Spotlight
              </Button>
            )}
          </SpotlightControls>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </MainContent>
      </MainLayout>
      <ProfileEdit
        currentName={userData?.me?.name || ''}
        currentAvatarUrl={userData?.me?.avatarUrl}
        onClose={() => setIsProfileEditOpen(false)}
        isOpen={isProfileEditOpen}
      />
    </Container>
  );
}; 