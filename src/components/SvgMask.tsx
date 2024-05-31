import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  View,
  TouchableWithoutFeedback,
  type LayoutChangeEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import type { MaskProps, SvgMaskPathFunction, ValueXY } from "../types";

const AnimatedSvgPath = Animated.createAnimatedComponent(Path);
const windowDimensions = Dimensions.get("window");

const defaultSvgPath: SvgMaskPathFunction = ({
  size,
  position,
  canvasSize,
}): string => {
  const cornerRadius = 12; // You can adjust this value based on the desired radius
  const padding = 12;
  const positionX = position.x._value - padding;
  const positionY = position.y._value - padding;
  const sizeX = size.x._value + 2 * padding;
  const sizeY = size.y._value + 2 * padding;

  return `M0,0H${canvasSize.x}V${canvasSize.y}H0V0ZM${positionX + cornerRadius}, ${positionY}H${positionX + sizeX - cornerRadius}Q${positionX + sizeX}, ${positionY} ${positionX + sizeX}, ${positionY + cornerRadius}V${positionY + sizeY - cornerRadius}Q${positionX + sizeX}, ${positionY + sizeY} ${positionX + sizeX - cornerRadius}, ${positionY + sizeY}H${positionX + cornerRadius}Q${positionX}, ${positionY + sizeY} ${positionX}, ${positionY + sizeY - cornerRadius}V${positionY + cornerRadius}Q${positionX}, ${positionY} ${positionX + cornerRadius}, ${positionY}Z`;
};

export const SvgMask = ({
  size,
  position,
  style,
  easing = Easing.linear,
  animationDuration = 300,
  animated,
  backdropColor,
  svgMaskPath = defaultSvgPath,
  onPressMask,
  onPressInner,
  currentStep,
}: MaskProps) => {
  const [canvasSize, setCanvasSize] = useState<ValueXY>({
    x: windowDimensions.width,
    y: windowDimensions.height,
  });
  const sizeValue = useRef<Animated.ValueXY>(
    new Animated.ValueXY(size ?? { x: 0, y: 0 }),
  ).current;
  const positionValue = useRef<Animated.ValueXY>(
    new Animated.ValueXY(position ?? { x: 0, y: 0 }),
  ).current;
  const maskRef = useRef<any>(null);

  const animationListener = useCallback(() => {
    const d = svgMaskPath({
      size: sizeValue,
      position: positionValue,
      canvasSize,
      step: currentStep,
    });

    if (maskRef.current) {
      maskRef.current.setNativeProps({ d });
    }
  }, [canvasSize, currentStep, svgMaskPath, positionValue, sizeValue]);

  const animate = useCallback(
    (toSize: ValueXY = size, toPosition: ValueXY = position) => {
      if (animated) {
        Animated.parallel([
          Animated.timing(sizeValue, {
            toValue: toSize,
            duration: animationDuration,
            easing,
            useNativeDriver: false,
          }),
          Animated.timing(positionValue, {
            toValue: toPosition,
            duration: animationDuration,
            easing,
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        sizeValue.setValue(toSize);
        positionValue.setValue(toPosition);
      }
    },
    [
      animated,
      animationDuration,
      easing,
      positionValue,
      position,
      size,
      sizeValue,
    ],
  );

  useEffect(() => {
    const id = positionValue.addListener(animationListener);
    return () => {
      positionValue.removeListener(id);
    };
  }, [animationListener, positionValue]);

  useEffect(() => {
    if (size && position) {
      animate(size, position);
    }
  }, [animate, position, size]);

  const handleLayout = ({
    nativeEvent: {
      layout: { width, height },
    },
  }: LayoutChangeEvent) => {
    setCanvasSize({
      x: width,
      y: height,
    });
  };

  return (
    <TouchableWithoutFeedback style={{ pointerEvents: "none" }}>
      <View
        style={style}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => true}
        pointerEvents="none"
      >
        {canvasSize ? (
          <Svg
            pointerEvents="none"
            style={{ pointerEvents: "none" }}
            width={canvasSize.x}
            height={canvasSize.y}
          >
            <AnimatedSvgPath
              pointerEvents="none"
              ref={maskRef}
              fill={backdropColor}
              fillRule="evenodd"
              strokeWidth={1}
              d={svgMaskPath({
                size: sizeValue,
                position: positionValue,
                canvasSize,
                step: currentStep,
              })}
            />
          </Svg>
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
};
