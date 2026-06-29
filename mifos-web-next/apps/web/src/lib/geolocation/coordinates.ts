/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const GPS_COORDINATE_DECIMAL_PLACES = 8;

export function roundGpsCoordinate(
  value: number,
  decimalPlaces = GPS_COORDINATE_DECIMAL_PLACES
): number {
  const factor = 10 ** decimalPlaces;
  return Math.round(value * factor) / factor;
}

export function geolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access was denied. Allow location in your browser settings and try again.';
    case error.POSITION_UNAVAILABLE:
      return 'Could not determine your location. Check that GPS or location services are enabled.';
    case error.TIMEOUT:
      return 'Location detection timed out. Try again when you have a clearer signal.';
    default:
      return 'Could not read your location.';
  }
}

export function readCurrentGpsPosition(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15_000,
    maximumAge: 60_000
  }
): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: roundGpsCoordinate(position.coords.latitude),
          longitude: roundGpsCoordinate(position.coords.longitude)
        });
      },
      (error) => {
        reject(new Error(geolocationErrorMessage(error)));
      },
      options
    );
  });
}
