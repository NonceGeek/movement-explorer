import { useMemo } from "react";
import {
  type GeoData,
  type ValidatorData,
  useGetValidators,
} from "./useGetValidators";

export type ValidatorGeoMetric = {
  nodeCount: number;
  countryCount: number;
  cityCount: number;
};

export type City = {
  name: string;
  count: number;
};

export interface ValidatorGeoGroup {
  country: string;
  countryLat: number;
  countryLng: number;
  nodes: GeoData[];
  cities: City[];
}

export function useGetValidatorSetGeoData() {
  const { validators } = useGetValidators();

  const { validatorGeoGroups, validatorGeoMetric } = useMemo(() => {
    const groups: ValidatorGeoGroup[] = validators.reduce(
      (groups: ValidatorGeoGroup[], validatorData: ValidatorData) => {
        const geoData = validatorData.location_stats;
        const country = geoData?.country;
        if (!country) {
          return groups;
        }

        const existingGroup = groups.find((group) => group.country === country);
        if (existingGroup) {
          existingGroup.nodes.push(geoData);
        } else {
          const newGroup: ValidatorGeoGroup = {
            country: country,
            countryLat: 0,
            countryLng: 0,
            nodes: [geoData],
            cities: [],
          };
          groups.push(newGroup);
        }
        return groups;
      },
      [],
    );

    let totalCityCount = 0;

    groups.forEach((group: ValidatorGeoGroup) => {
      const count = group.nodes.length;

      // Calculate average lat/lng for the country
      const latitudeSum = group.nodes.reduce((sum: number, node: GeoData) => {
        return sum + node.latitude;
      }, 0);
      const longitudeSum = group.nodes.reduce((sum: number, node: GeoData) => {
        return sum + node.longitude;
      }, 0);
      group.countryLat = latitudeSum / count;
      group.countryLng = longitudeSum / count;

      // Aggregate cities
      const cities = group.cities;
      group.nodes.forEach((node: GeoData) => {
        const city = node.city;
        const existingCity = cities.find(
          (nodeCity: City) => nodeCity.name === city,
        );
        if (existingCity) {
          existingCity.count++;
        } else {
          const newCity = { name: city, count: 1 };
          cities.push(newCity);
        }
      });
      cities.sort((city1: City, city2: City) => city2.count - city1.count);

      totalCityCount += cities.length;
    });

    return {
      validatorGeoGroups: groups,
      validatorGeoMetric: {
        nodeCount: validators.length,
        countryCount: groups.length,
        cityCount: totalCityCount,
      },
    };
  }, [validators]);

  const hasGeoData = validatorGeoGroups.length > 0;

  return { validatorGeoGroups, validatorGeoMetric, hasGeoData };
}
