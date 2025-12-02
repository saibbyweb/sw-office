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
import { IoArrowBack, IoVideocam, IoWifi } from 'react-icons/io5';
import { TextureLoader } from 'three';
import { Users, Edit2 } from 'react-feather';
import { Button } from './common';
import { ProfileEdit } from '../../components/ProfileEdit';
import appIcon from '../../assets/icon.png';
import { API_HOST } from '../../services/env';
import { theme } from '../styles/theme';
import { useCall } from '../../components/CallProvider';
import { toast } from 'react-hot-toast';
import { useConnectedUsers } from '../../contexts/ConnectedUsersContext';
import { TeamMembersList } from './TeamMembersList';

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
  height: calc(100vh);  // Subtract header height
`;

const Sidebar = styled.div`
  width: 280px;
  height: 100%;
  background-color: #1e2738;
  padding: 16px 0;
  overflow-y: auto;
  flex-shrink: 0;
  z-index: 10;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
`;

const SidebarHeader = styled.div`
  padding: 0 16px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  margin-bottom: 16px;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
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

// Update the ConnectedUsersCount styled component
const ConnectedUsersCount = styled.div<{ hasConnectedUsers: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px;
  margin-bottom: 15px;
  background-color: ${props => props.hasConnectedUsers 
    ? 'rgba(76, 175, 80, 0.2)' 
    : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  font-size: 14px;
  color: ${props => props.hasConnectedUsers ? '#7AFFB2' : '#FFFFFF'};
`;

const ACControlButton = styled.button<{ isOn: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 15px;
  margin: 20px 15px 15px 15px; // Added top and side margins
  background-color: ${props => props.isOn 
    ? 'rgba(59, 130, 246, 0.2)' 
    : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.isOn ? '#3B82F6' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 8px;
  font-size: 14px;
  color: ${props => props.isOn ? '#60A5FA' : '#FFFFFF'};
  cursor: pointer;
  transition: all 0.2s ease;
  width: calc(100% - 30px); // Adjust width to account for margins

  &:hover {
    background-color: ${props => props.isOn 
      ? 'rgba(59, 130, 246, 0.3)' 
      : 'rgba(255, 255, 255, 0.15)'};
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

// Enhanced materials for the chair
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

// Enhanced table materials with better textures
const tableMaterials = {
  wood: new THREE.MeshPhongMaterial({
    map: textureLoader.load('/textures/floor.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(0.5, 0.5);
      texture.colorSpace = THREE.SRGBColorSpace;
    }),
    shininess: 40,
    specular: 0x444444,
    bumpMap: textureLoader.load('/textures/floor.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(0.5, 0.5);
    }),
    bumpScale: 0.02,
  }),
  legs: new THREE.MeshPhongMaterial({
    color: 0x1a1a1a,
    shininess: 30,
    specular: 0x222222,
  })
};

// Enhanced room materials with better textures
const roomMaterials = {
  floorLight: new THREE.MeshPhongMaterial({
    color: 0xE8E8E8, // Light silverish color
    shininess: 15,
    specular: 0x111111,
    map: textureLoader.load('/textures/floor_silver.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2); // More repeats for carpet pattern
      texture.colorSpace = THREE.SRGBColorSpace;
    }),
    bumpMap: textureLoader.load('/textures/floor_silver.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);
    }),
    bumpScale: 0.02, // Increased for more texture
  }),
  floorDark: new THREE.MeshPhongMaterial({
    color: 0xD0D0D0, // Slightly darker silverish
    shininess: 15,
    specular: 0x111111,
    map: textureLoader.load('/textures/dark_floor.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);
      texture.colorSpace = THREE.SRGBColorSpace;
    }),
    bumpMap: textureLoader.load('/textures/dark_floor.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);
    }),
    bumpScale: 0.02,
  }),
  floorSide: new THREE.MeshPhongMaterial({
    color: 0xC0C0C0, // Medium silver for sides
    shininess: 20,
    specular: 0x111111,
  })
};

// Enhanced laptop materials
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
  },
  // Air conditioner materials
  airConditioner: {
    body: new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 80,
      specular: 0x666666,
    }),
    vents: new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 20,
    }),
    display: new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      shininess: 100,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3,
    }),
    trim: new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      shininess: 60,
      specular: 0x444444,
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

// Create air conditioner function
const createAirConditioner = () => {
  const acGroup = new THREE.Group();

  // Main body
  const bodyGeometry = new THREE.BoxGeometry(8, 2, 1.5);
  const body = new THREE.Mesh(bodyGeometry, decorMaterials.airConditioner.body);
  body.castShadow = true;
  acGroup.add(body);

  // Vents (horizontal slats)
  for (let i = 0; i < 6; i++) {
    const ventGeometry = new THREE.BoxGeometry(7.8, 0.1, 0.05);
    const vent = new THREE.Mesh(ventGeometry, decorMaterials.airConditioner.vents);
    vent.position.set(0, -0.8 + i * 0.3, 0.7);
    acGroup.add(vent);
  }

  // Digital display
  const displayGeometry = new THREE.PlaneGeometry(1.5, 0.4);
  const display = new THREE.Mesh(displayGeometry, decorMaterials.airConditioner.display);
  display.position.set(0, 0.5, 0.7);
  acGroup.add(display);

  // Control panel
  const panelGeometry = new THREE.PlaneGeometry(2, 0.6);
  const panel = new THREE.Mesh(panelGeometry, decorMaterials.airConditioner.body);
  panel.position.set(0, -0.2, 0.7);
  acGroup.add(panel);

  // Trim pieces
  const trimGeometry = new THREE.BoxGeometry(8.2, 0.1, 0.1);
  const topTrim = new THREE.Mesh(trimGeometry, decorMaterials.airConditioner.trim);
  topTrim.position.set(0, 1.05, 0);
  acGroup.add(topTrim);

  const bottomTrim = new THREE.Mesh(trimGeometry, decorMaterials.airConditioner.trim);
  bottomTrim.position.set(0, -1.05, 0);
  acGroup.add(bottomTrim);

  // Side trims
  const sideTrimGeometry = new THREE.BoxGeometry(0.1, 2.1, 0.1);
  const leftTrim = new THREE.Mesh(sideTrimGeometry, decorMaterials.airConditioner.trim);
  leftTrim.position.set(-4.1, 0, 0);
  acGroup.add(leftTrim);

  const rightTrim = new THREE.Mesh(sideTrimGeometry, decorMaterials.airConditioner.trim);
  rightTrim.position.set(4.1, 0, 0);
  acGroup.add(rightTrim);

  // Add subtle rotation for floating effect
  acGroup.rotation.x = -0.1;

  return acGroup;
};

// Create enhanced room function with better lighting and atmosphere
const createRoom = () => {
  const roomGroup = new THREE.Group();
  const roomSize = { width: 60, height: 15, depth: 60 };
  const tileSize = 3; // Larger tiles for carpet effect
  const tileHeight = 0.1; // Thinner tiles for carpet
  const floorDepth = 0.4;
  
  // Create floor with enhanced carpet pattern
  const floorGroup = new THREE.Group();
  const tilesX = Math.ceil(roomSize.width / tileSize);
  const tilesZ = Math.ceil(roomSize.depth / tileSize);
  
  // Create base floor with enhanced material
  const baseFloorGeometry = new THREE.BoxGeometry(roomSize.width, floorDepth, roomSize.depth);
  const baseFloor = new THREE.Mesh(baseFloorGeometry, roomMaterials.floorSide);
  baseFloor.position.y = -floorDepth/2;
  baseFloor.receiveShadow = true;
  floorGroup.add(baseFloor);
  
  // Create individual tiles with enhanced carpet pattern
  for (let x = 0; x < tilesX; x++) {
    for (let z = 0; z < tilesZ; z++) {
      const isEven = (x + z) % 2 === 0;
      const isCenter = Math.abs(x - tilesX/2) < 3 && Math.abs(z - tilesZ/2) < 3;
      
      const tileGeometry = new THREE.BoxGeometry(tileSize * 0.95, tileHeight, tileSize * 0.95);
      
      // Create different materials for carpet pattern
      let tileMaterial;
      if (isCenter) {
        // Center area - lighter silver
        tileMaterial = new THREE.MeshPhongMaterial({
          color: 0xF5F5F5,
          shininess: 10,
          specular: 0x222222,
        });
      } else if (isEven) {
        // Even tiles - medium silver
        tileMaterial = new THREE.MeshPhongMaterial({
          color: 0xE0E0E0,
          shininess: 12,
          specular: 0x222222,
        });
      } else {
        // Odd tiles - darker silver with subtle pattern
        tileMaterial = new THREE.MeshPhongMaterial({
          color: 0xD0D0D0,
          shininess: 12,
          specular: 0x222222,
        });
      }
      
      const tile = new THREE.Mesh(tileGeometry, tileMaterial);
      
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

// Create particle system for atmosphere
const createParticleSystem = () => {
  const particleCount = 200;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    
    // Random positions in a large sphere
    const radius = 50 + Math.random() * 30;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.cos(phi);
    positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    
    // Subtle blue-white colors
    colors[i3] = 0.8 + Math.random() * 0.2;
    colors[i3 + 1] = 0.9 + Math.random() * 0.1;
    colors[i3 + 2] = 1.0;
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particleSystem = new THREE.Points(particles, particleMaterial);
  return particleSystem;
};

// Create breeze effect from AC
const createBreezeEffect = () => {
  const breezeCount = 150;
  const breeze = new THREE.BufferGeometry();
  const positions = new Float32Array(breezeCount * 3);
  const velocities = new Float32Array(breezeCount * 3);
  const colors = new Float32Array(breezeCount * 3);
  const sizes = new Float32Array(breezeCount);

  for (let i = 0; i < breezeCount; i++) {
    const i3 = i * 3;
    
    // Start particles from AC vents area
    positions[i3] = (Math.random() - 0.5) * 6; // Spread across AC width
    positions[i3 + 1] = 11 + Math.random() * 1; // AC height
    positions[i3 + 2] = -24 + Math.random() * 2; // AC depth
    
    // Velocity - particles move toward table and chairs
    velocities[i3] = (Math.random() - 0.5) * 0.02; // Slight horizontal spread
    velocities[i3 + 1] = -0.01 - Math.random() * 0.02; // Downward movement
    velocities[i3 + 2] = 0.03 + Math.random() * 0.02; // Forward movement
    
    // Cool blue-white colors for AC breeze
    colors[i3] = 0.7 + Math.random() * 0.3; // Blue
    colors[i3 + 1] = 0.8 + Math.random() * 0.2; // Light blue
    colors[i3 + 2] = 0.9 + Math.random() * 0.1; // Almost white
    
    // Varying sizes for more realistic effect
    sizes[i] = 0.3 + Math.random() * 0.4;
  }

  breeze.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  breeze.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  breeze.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const breezeMaterial = new THREE.PointsMaterial({
    size: 1,
    vertexColors: true,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  const breezeSystem = new THREE.Points(breeze, breezeMaterial);
  
  // Store velocities for animation
  (breezeSystem as any).velocities = velocities;
  (breezeSystem as any).originalPositions = new Float32Array(positions);
  
  return breezeSystem;
};

// Create decorative plant function
const createPlant = () => {
  const plantGroup = new THREE.Group();

  // Pot
  const potGeometry = new THREE.CylinderGeometry(0.8, 0.6, 1.2, 8);
  const potMaterial = new THREE.MeshPhongMaterial({
    color: 0x8B4513,
    shininess: 20,
  });
  const pot = new THREE.Mesh(potGeometry, potMaterial);
  pot.position.y = 0.6;
  pot.castShadow = true;
  plantGroup.add(pot);

  // Leaves (simple spheres for now)
  for (let i = 0; i < 8; i++) {
    const leafGeometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 8, 8);
    const leafMaterial = new THREE.MeshPhongMaterial({
      color: 0x228B22,
      shininess: 10,
    });
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    
    const angle = (i / 8) * Math.PI * 2;
    const radius = 0.8 + Math.random() * 0.3;
    leaf.position.set(
      Math.cos(angle) * radius,
      1.5 + Math.random() * 0.5,
      Math.sin(angle) * radius
    );
    leaf.castShadow = true;
    plantGroup.add(leaf);
  }

  return plantGroup;
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
  const { connectedUsers } = useConnectedUsers();
  
  // AC control state
  const [isACOn, setIsACOn] = useState(false);
  const [breezeEffect, setBreezeEffect] = useState<THREE.Points | null>(null);
  
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
    if (!teamData?.getTeamUsers || !sceneRef.current) return;

    console.log('Updating chair positions for users:', teamData.getTeamUsers);

    const users = teamData.getTeamUsers;
    const spacing = 6; // Increased spacing for better visual separation
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
        const zPosition = isFirstSide ? -6 : 6; // Increased distance from table
        
        // Rotate chairs to face the table
        chair.mesh.rotation.y = isFirstSide ? 0 : Math.PI;
        
        // Position chair
        chair.mesh.position.set(xPosition, 0, zPosition);

        // Glow effect removed - no longer needed

        // Add laptop and project name if user is active
        if (user.activeSession) {
        const laptop = createLaptop(true);
        laptop.name = 'laptop';
        
        laptop.position.set(
          xPosition,
            2,
            isFirstSide ? -3.5 : 3.5 // Adjusted for new chair positions
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
                isFirstSide ? -3.5 : 3.5
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
                isFirstSide ? -3.5 : 3.5
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
                isFirstSide ? -3.5 : 3.5
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
                child.material.emissive = new THREE.Color(0x000000);
                child.material.emissiveIntensity = 0;
              } else {
                child.material.color.setHex(0x333333);
                child.material.emissive = new THREE.Color(0x000000);
                child.material.emissiveIntensity = 0;
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

    // Initialize scene with enhanced background
    const mainScene = new THREE.Scene();
    
    // Set gradient background for more atmosphere
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 2);
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 2, 2);
    }
    const backgroundTexture = new THREE.CanvasTexture(canvas);
    mainScene.background = backgroundTexture;
    
    // Add fog for depth and atmosphere
    mainScene.fog = new THREE.Fog(0x1e293b, 30, 100);
    
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
    });
    
    sceneRef.current = mainScene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Enhanced renderer settings
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    mainScene.add(ambientLight);

    // Main directional light (sunlight) with enhanced settings
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(15, 25, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    directionalLight.shadow.bias = -0.0005;
    directionalLight.shadow.normalBias = 0.02;
    mainScene.add(directionalLight);

    // Add fill light for better illumination
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-15, 15, -15);
    mainScene.add(fillLight);

    // Add rim light for depth
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, 10, -20);
    mainScene.add(rimLight);

    // Add subtle point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0x4a90e2, 0.5, 30);
    pointLight1.position.set(-20, 8, -20);
    mainScene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xe24a90, 0.3, 25);
    pointLight2.position.set(20, 6, 20);
    mainScene.add(pointLight2);

    // Add decorative lighting from air conditioner
    const acLight = new THREE.SpotLight(0x87CEEB, 0.3, 20, Math.PI / 6, 0.3);
    acLight.position.set(0, 11, -24);
    acLight.target.position.set(0, 0, 0);
    acLight.castShadow = true;
    mainScene.add(acLight);
    mainScene.add(acLight.target);

    // Add room
    const room = createRoom();
    mainScene.add(room);

    // Add conference table - centered in the room
    const table = addTable();
    if (table) {
      table.position.set(0, 0, 0);
      mainScene.add(table);
    }

    // Add floating air conditioner
    const airConditioner = createAirConditioner();
    airConditioner.position.set(0, 12, -25); // Positioned above and behind the table
    mainScene.add(airConditioner);

    // Add subtle floating animation to air conditioner
    gsap.to(airConditioner.position, {
      y: 12.5,
      duration: 3,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1
    });

    // Add decorative plants in corners
    const plant1 = createPlant();
    plant1.position.set(-25, 0, -25);
    mainScene.add(plant1);

    const plant2 = createPlant();
    plant2.position.set(25, 0, -25);
    mainScene.add(plant2);

    const plant3 = createPlant();
    plant3.position.set(-25, 0, 25);
    mainScene.add(plant3);

    const plant4 = createPlant();
    plant4.position.set(25, 0, 25);
    mainScene.add(plant4);

    // Add particle system for atmosphere
    const particleSystem = createParticleSystem();
    mainScene.add(particleSystem);

    // Add subtle rotation to particle system
    gsap.to(particleSystem.rotation, {
      y: Math.PI * 2,
      duration: 60,
      ease: "none",
      repeat: -1
    });

    // Add breeze effect from AC
    const breezeEffect = createBreezeEffect();
    breezeEffect.visible = false; // Hidden by default
    setBreezeEffect(breezeEffect);
    mainScene.add(breezeEffect);

    // Set camera for enhanced isometric-like view
    camera.position.set(45, 30, 45); // Zoomed out more to show AC and breeze
    camera.lookAt(0, 0, 0);

    // Enhanced controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 200;
    controls.target.set(0, 5, 0);
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 1.0;
    controls.maxPolarAngle = Math.PI / 2.2; // Prevent going below ground
    controlsRef.current = controls;

    // Update user blocks
    await updateChairPositions();

    // Enhanced animation loop with post-processing effects
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      
      // Animate particle system
      if (particleSystem) {
        particleSystem.rotation.y += 0.001;
      }
      
      // Animate breeze effect
      if (breezeEffect && breezeEffect.visible) {
        const positions = breezeEffect.geometry.attributes.position.array as Float32Array;
        const velocities = (breezeEffect as any).velocities as Float32Array;
        const originalPositions = (breezeEffect as any).originalPositions as Float32Array;
        const breezeCount = 150; // Match the count from createBreezeEffect
        
        for (let i = 0; i < breezeCount; i++) {
          const i3 = i * 3;
          
          // Update positions based on velocities
          positions[i3] += velocities[i3];
          positions[i3 + 1] += velocities[i3 + 1];
          positions[i3 + 2] += velocities[i3 + 2];
          
          // Add some turbulence
          positions[i3] += Math.sin(Date.now() * 0.001 + i) * 0.001;
          positions[i3 + 1] += Math.cos(Date.now() * 0.002 + i) * 0.001;
          
          // Reset particles that have moved too far or too low
          if (positions[i3 + 1] < 0.5 || positions[i3 + 2] > 10) {
            positions[i3] = originalPositions[i3];
            positions[i3 + 1] = originalPositions[i3 + 1];
            positions[i3 + 2] = originalPositions[i3 + 2];
          }
        }
        
        breezeEffect.geometry.attributes.position.needsUpdate = true;
      }
      
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
          x: 45,
          y: 30,
          z: 45,
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
              y: 20, // Higher up to show AC
              z: chair.mesh.position.z - 20 // Further back to show more of the scene
            } : 
            { 
              x: chair.mesh.position.x,
              y: 20, // Higher up to show AC
              z: chair.mesh.position.z + 20 // Further back to show more of the scene
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

    if (!loading && teamData?.getTeamUsers) {
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
                y: 20, // Higher up to show AC
                z: currentUserChair.mesh.position.z - 20 // Further back to show more of the scene
              } : 
              { 
                x: currentUserChair.mesh.position.x,
                y: 20, // Higher up to show AC
                z: currentUserChair.mesh.position.z + 20 // Further back to show more of the scene
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

  const toggleAC = () => {
    const newACState = !isACOn;
    setIsACOn(newACState);
    
    if (newACState) {
      // Turn on AC - start breeze and set specific camera position
      if (breezeEffect) {
        breezeEffect.visible = true;
      }
      
      // Set camera to specific position showing AC and table
      if (cameraRef.current && controlsRef.current) {
        // Position camera to show both AC and table - more centered and zoomed in
        gsap.to(cameraRef.current.position, {
          x: 0, // Center horizontally
          y: 28, // Slightly lower for better centering
          z: 28, // Closer for more zoomed in view
          duration: 2,
          ease: "power2.inOut"
        });
        
        // Look at the center of the scene
        gsap.to(controlsRef.current.target, {
          x: 0,
          y: 6, // Look at middle height for better centering
          z: 0,
          duration: 2,
          ease: "power2.inOut"
        });
      }
    } else {
      // Turn off AC - stop breeze and return to default camera position
      if (breezeEffect) {
        breezeEffect.visible = false;
      }
      
      // Return to default camera position
      if (cameraRef.current && controlsRef.current) {
        gsap.to(cameraRef.current.position, {
          x: 45,
          y: 30,
          z: 45,
          duration: 2,
          ease: "power2.inOut"
        });
        
        gsap.to(controlsRef.current.target, {
          x: 0,
          y: 5,
          z: 0,
          duration: 2,
          ease: "power2.inOut"
        });
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <MainLayout>
        <Sidebar>
          <SidebarHeader>Team Members</SidebarHeader>
          <ConnectedUsersCount hasConnectedUsers={connectedUsers.length > 0}>
            <IoWifi size={16} color={connectedUsers.length > 0 ? "#7AFFB2" : "#FFFFFF"} />
            {connectedUsers.length > 0 
              ? `${connectedUsers.length} user${connectedUsers.length !== 1 ? 's' : ''} online`
              : 'No users online'}
          </ConnectedUsersCount>
          <ACControlButton isOn={isACOn} onClick={toggleAC}>
            {isACOn ? 'Turn off AC' : 'Turn on AC'}
          </ACControlButton>
          <TeamMembersList
            users={teamData?.getTeamUsers || []}
            connectedUsers={connectedUsers}
            currentUserId={userData?.me?.id}
            onMemberClick={handleMemberClick}
            onCallUser={handleCallUser}
          />
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