import * as React from 'react';
import Animated from 'react-native-reanimated';
import { Defs, LinearGradient, Stop, Path, PathProps } from 'react-native-svg';

import { LineChartDimensionsContext } from './Chart';
import { LineChartPathContext } from './LineChartPathContext';
import useAnimatedPath from './useAnimatedPath';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type LineChartGradientProps = Animated.AnimateProps<PathProps> & {
  color?: string;
  colors?: string[];
  locations?: Array<number | string>;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  opacityScale?: number;
  variant?: 'default' | 'strongTop' | 'toWhite';
  backgroundColor?: string; // background color at the bottom of the gradient, default white
  children?: React.ReactNode;
};

let id = 0;

LineChartGradient.displayName = 'LineChartGradient';

export function LineChartGradient({
  color: overrideColor = undefined,
  colors,
  locations,
  start,
  end,
  opacityScale = 1,
  variant = 'default',
  backgroundColor = '#FFFFFF',
  children,
  ...props
}: LineChartGradientProps) {
  const { area } = React.useContext(LineChartDimensionsContext);
  const { color: contextColor, isTransitionEnabled } =
    React.useContext(LineChartPathContext);

  const color = overrideColor || contextColor;

  const { animatedProps } = useAnimatedPath({
    enabled: isTransitionEnabled,
    path: area,
  });

  const localId = React.useRef(++id);

  const toPct = (v: number) => `${Math.max(0, Math.min(1, v)) * 100}%`;

  const renderStops = (): React.ReactElement[] => {
    if (children)
      return React.Children.toArray(children) as React.ReactElement[];

    if (colors && colors.length) {
      const locs =
        locations && locations.length === colors.length
          ? locations
          : colors.map((_, i) => toPct(i / (colors.length - 1 || 1)));

      return colors.map((c, i) => (
        <Stop
          key={`${i}`}
          offset={
            typeof locs[i] === 'number'
              ? toPct(locs[i] as number)
              : (locs[i] as string)
          }
          stopColor={c || color}
        />
      ));
    }

    return buildPresetStops();
  };

  const buildPresetStops = (): React.ReactElement[] => {
    if (variant === 'strongTop') {
      return [
        <Stop
          key="0"
          offset={toPct(0.0)}
          stopColor={color}
          stopOpacity={0.45 * opacityScale}
        />,
        <Stop
          key="1"
          offset={toPct(0.35)}
          stopColor={color}
          stopOpacity={0.2 * opacityScale}
        />,
        <Stop
          key="2"
          offset={toPct(1.0)}
          stopColor={color}
          stopOpacity={0.0}
        />,
      ];
    }

    if (variant === 'toWhite') {
      return [
        // Top: strong color
        <Stop
          key="0"
          offset={toPct(0.0)}
          stopColor={color}
          stopOpacity={0.7 * opacityScale}
        />,
        // 40%: still significant color
        <Stop
          key="1"
          offset={toPct(0.4)}
          stopColor={color}
          stopOpacity={0.45 * opacityScale}
        />,
        // 80%: start blending with white
        <Stop
          key="2"
          offset={toPct(0.8)}
          stopColor={backgroundColor}
          stopOpacity={0.15 * opacityScale}
        />,
        // Bottom: transparent white
        <Stop
          key="3"
          offset={toPct(1.0)}
          stopColor={backgroundColor}
          stopOpacity={0.0}
        />,
      ];
    }

    return [
      <Stop
        key="0"
        offset="20%"
        stopColor={color}
        stopOpacity={0.15 * opacityScale}
      />,
      <Stop
        key="1"
        offset="40%"
        stopColor={color}
        stopOpacity={0.05 * opacityScale}
      />,
      <Stop key="2" offset="100%" stopColor={color} stopOpacity={0.0} />,
    ];
  };

  const x1 = start ? `${start.x * 100}%` : '0%';
  const y1 = start ? `${start.y * 100}%` : '0%';
  const x2 = end ? `${end.x * 100}%` : '0%';
  const y2 = end ? `${end.y * 100}%` : '100%'; // Default direction: top to bottom (y1=0 → y2=100%)

  return (
    <>
      <Defs>
        <LinearGradient
          id={`${localId.current}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
        >
          {renderStops()}
        </LinearGradient>
      </Defs>
      <AnimatedPath
        animatedProps={animatedProps}
        fill={`url(#${localId.current})`}
        {...props}
      />
    </>
  );
}
