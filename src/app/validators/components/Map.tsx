"use client";

import { useTheme } from "next-themes";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  City,
  ValidatorGeoGroup,
} from "@/hooks/validators/useGetValidatorSetGeoData";

const MARKER_COLOR = "#22D3EE";
const MIN_NODE_COUNT_SHOWN_IN_MARKER = 5;

function getCircleRadius(currentGroupSize: number) {
  return Math.pow(currentGroupSize, 1 / 4) * 4;
}

function MapMarker({ group }: { group: ValidatorGeoGroup }) {
  const { country, countryLng, countryLat, nodes, cities } = group;
  const radius = getCircleRadius(nodes.length);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Marker coordinates={[countryLng, countryLat]}>
            <g>
              <circle
                fill="rgba(0,0,0,0)"
                stroke={MARKER_COLOR}
                strokeWidth={0.6}
                strokeOpacity={0.4}
                r={radius + 2}
              />
              <circle
                fill="rgba(0,0,0,0)"
                stroke={MARKER_COLOR}
                strokeWidth={0.6}
                strokeOpacity={0.8}
                r={radius + 0.9}
              />
              <circle fill={MARKER_COLOR} r={radius} />
              {nodes.length >= MIN_NODE_COUNT_SHOWN_IN_MARKER && (
                <text
                  textAnchor="middle"
                  fill="#1a1a2e"
                  transform="translate(0, 3.3)"
                  fontSize={9}
                >
                  {nodes.length}
                </text>
              )}
            </g>
          </Marker>
        </TooltipTrigger>
        <TooltipContent className="[&_span]:inline [&_svg]:inline">
          <div className="p-1">
            <div className="flex justify-between gap-4 mb-1">
              <span className="text-sm">{country}</span>
              <span className="text-sm">{nodes.length}</span>
            </div>
            {cities.map((city: City) => (
              <div
                key={city.name}
                className="flex justify-between gap-4 text-xs mb-0.5"
              >
                <span>{city.name}</span>
                <span>{city.count}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface MapProps {
  validatorGeoGroups: ValidatorGeoGroup[];
}

export default function ValidatorsWorldMap({ validatorGeoGroups }: MapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="w-full h-full">
      <ComposableMap
        projectionConfig={{
          rotate: [0, 10, 0],
          center: [0, 30],
          scale: 130,
        }}
        projection="geoMercator"
        height={450}
      >
        <Geographies geography="/world.json">
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={isDark ? "#4a4a5a" : "#e0e0e0"}
                style={{
                  default: { outline: "0" },
                  hover: { outline: "0" },
                  pressed: { outline: "0" },
                }}
              />
            ))
          }
        </Geographies>
        {validatorGeoGroups.map((group, idx) => (
          <MapMarker key={`${group.country}-${idx}`} group={group} />
        ))}
      </ComposableMap>
    </div>
  );
}
