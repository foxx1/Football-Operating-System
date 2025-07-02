import React, { useRef, useEffect, useState } from 'react';
import { Group, Line, Circle, Rect, Text, Transformer, Image } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Vector2d } from 'konva/lib/types';
import { Group as GroupType } from 'konva/lib/Group';
import { Transformer as TransformerType } from 'konva/lib/shapes/Transformer';
import useImage from 'use-image';
import { DrawingElement } from './types';

// Import tactical icons
import classicFootballSvg from '@/assets/classic-football.svg';
import coneSvg from '@/assets/tactical-icons/cone-orange.svg';
import flagSvg from '@/assets/tactical-icons/flag-red.svg';

interface KonvaDrawingElementProps {
  element: DrawingElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDrag: (id: string, newPos: Vector2d) => void;
  onDragEnd: () => void;
  isPreview?: boolean;
}

export const KonvaDrawingElement: React.FC<KonvaDrawingElementProps> = ({
  element,
  isSelected,
  onSelect,
  onDrag,
  onDragEnd,
  isPreview = false
}) => {
  const groupRef = useRef<GroupType>(null);
  const transformerRef = useRef<TransformerType>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Load images for icons
  const [footballImage] = useImage(classicFootballSvg);
  const [coneImage] = useImage(coneSvg);
  const [flagImage] = useImage(flagSvg);

  // Update transformer when selection changes
  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (!isPreview) {
      onSelect(element.id);
    }
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    const pos = e.target.position();
    onDrag(element.id, pos);
  };

  const handleMouseEnter = () => {
    if (!isPreview) {
      setIsHovered(true);
      document.body.style.cursor = 'pointer';
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    document.body.style.cursor = 'default';
  };

  const renderElement = () => {
    const baseProps = {
      stroke: element.color,
      strokeWidth: element.size || 2,
      fill: element.type === 'circle' || element.type === 'square' ? 'transparent' : undefined,
      opacity: isPreview ? 0.7 : 1,
      shadowEnabled: isHovered || isSelected,
      shadowColor: isSelected ? '#3b82f6' : '#000000',
      shadowBlur: isSelected ? 8 : 4,
      shadowOpacity: isSelected ? 0.6 : 0.3,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    };

    switch (element.type) {
      case 'line':
        return (
          <Line
            points={[
              0, 0,
              (element.endX || element.x) - element.x,
              (element.endY || element.y) - element.y
            ]}
            {...baseProps}
            dash={element.dashed ? [8, 4] : undefined}
          />
        );

      case 'arrow':
        const endX = (element.endX || element.x) - element.x;
        const endY = (element.endY || element.y) - element.y;
        const length = Math.sqrt(endX * endX + endY * endY);
        const arrowSize = Math.min(length * 0.1, 15);
        
        return (
          <Group>
            <Line
              points={[0, 0, endX, endY]}
              {...baseProps}
              dash={element.dashed ? [8, 4] : undefined}
            />
            {/* Arrow head */}
            <Line
              points={[
                endX - arrowSize * Math.cos(Math.atan2(endY, endX) - 0.3),
                endY - arrowSize * Math.sin(Math.atan2(endY, endX) - 0.3),
                endX,
                endY,
                endX - arrowSize * Math.cos(Math.atan2(endY, endX) + 0.3),
                endY - arrowSize * Math.sin(Math.atan2(endY, endX) + 0.3)
              ]}
              {...baseProps}
              fill={element.color}
              closed={true}
            />
          </Group>
        );

      case 'circle':
        return (
          <Circle
            radius={element.radius || 20}
            {...baseProps}
            dash={element.dashed ? [8, 4] : undefined}
          />
        );

      case 'square':
        return (
          <Rect
            width={element.width || 40}
            height={element.height || 40}
            offsetX={(element.width || 40) / 2}
            offsetY={(element.height || 40) / 2}
            {...baseProps}
            dash={element.dashed ? [8, 4] : undefined}
          />
        );

      case 'ball':
        return footballImage ? (
          <Image
            image={footballImage}
            width={30}
            height={30}
            offsetX={15}
            offsetY={15}
            shadowEnabled={isHovered || isSelected}
            shadowColor={isSelected ? '#3b82f6' : '#000000'}
            shadowBlur={isSelected ? 8 : 4}
            shadowOpacity={isSelected ? 0.6 : 0.3}
            shadowOffsetX={2}
            shadowOffsetY={2}
          />
        ) : (
          <Circle
            radius={15}
            fill="#8B4513"
            stroke="#654321"
            strokeWidth={2}
            shadowEnabled={isHovered || isSelected}
            shadowColor={isSelected ? '#3b82f6' : '#000000'}
            shadowBlur={isSelected ? 8 : 4}
            shadowOpacity={isSelected ? 0.6 : 0.3}
            shadowOffsetX={2}
            shadowOffsetY={2}
          />
        );

      case 'cone':
        return coneImage ? (
          <Image
            image={coneImage}
            width={25}
            height={25}
            offsetX={12.5}
            offsetY={12.5}
            shadowEnabled={isHovered || isSelected}
            shadowColor={isSelected ? '#3b82f6' : '#000000'}
            shadowBlur={isSelected ? 8 : 4}
            shadowOpacity={isSelected ? 0.6 : 0.3}
            shadowOffsetX={2}
            shadowOffsetY={2}
          />
        ) : (
          <Group>
            <Circle
              radius={12}
              fill="#FF6B35"
              stroke="#FF4500"
              strokeWidth={2}
            />
            <Text
              text="C"
              fontSize={12}
              fill="white"
              offsetX={4}
              offsetY={6}
            />
          </Group>
        );

      case 'flag':
        return flagImage ? (
          <Image
            image={flagImage}
            width={20}
            height={30}
            offsetX={10}
            offsetY={15}
            {...baseProps}
            stroke={undefined}
            strokeWidth={0}
          />
        ) : (
          <Group>
            <Line
              points={[0, -15, 0, 15]}
              stroke="#8B4513"
              strokeWidth={3}
            />
            <Rect
              x={0}
              y={-15}
              width={20}
              height={12}
              fill="#DC2626"
              stroke="#B91C1C"
              strokeWidth={1}
            />
          </Group>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Group
        ref={groupRef}
        x={element.x}
        y={element.y}
        draggable={!isPreview}
        onClick={handleClick}
        onDragMove={handleDragMove}
        onDragEnd={onDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        rotation={element.rotation || 0}
      >
        {renderElement()}
      </Group>
      
      {isSelected && !isPreview && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={[
            'top-left',
            'top-right', 
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
            'top-center',
            'bottom-center'
          ]}
          rotateEnabled={true}
          borderStroke="#3b82f6"
          borderStrokeWidth={2}
          anchorStroke="#3b82f6"
          anchorFill="#ffffff"
          anchorSize={8}
          anchorCornerRadius={2}
        />
      )}
    </>
  );
};