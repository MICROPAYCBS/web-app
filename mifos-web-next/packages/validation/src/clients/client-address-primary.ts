/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type { ClientAddressEntry } from './create-client.schema';



export function isClientAddressActive(address: ClientAddressEntry): boolean {

  return address.isActive !== false;

}



function firstActiveAddressIndex(addresses: ClientAddressEntry[]): number {

  return addresses.findIndex(isClientAddressActive);

}



/** Ensures exactly one primary when merging an address into a draft list. */

export function mergeClientAddressEntry(

  addresses: ClientAddressEntry[],

  entry: ClientAddressEntry,

  editIndex: number | null

): ClientAddressEntry[] {

  const isFirst = editIndex == null && addresses.length === 0;

  const normalizedEntry: ClientAddressEntry = {

    ...entry,

    isActive: entry.isActive ?? true,

    isPrimary: entry.isPrimary ?? isFirst

  };



  if (normalizedEntry.isPrimary && !isClientAddressActive(normalizedEntry)) {

    normalizedEntry.isPrimary = false;

  }



  let next =

    editIndex != null

      ? addresses.map((address, index) => (index === editIndex ? normalizedEntry : address))

      : [...addresses, normalizedEntry];



  if (normalizedEntry.isPrimary) {

    const primaryIndex = editIndex ?? next.length - 1;

    next = next.map((address, index) => ({

      ...address,

      isPrimary: index === primaryIndex

    }));

  } else if (!next.some((address) => address.isPrimary)) {

    const fallbackIndex = firstActiveAddressIndex(next);

    if (fallbackIndex >= 0) {

      next = next.map((address, index) => ({

        ...address,

        isPrimary: index === fallbackIndex

      }));

    }

  }



  return next;

}



/** Sets one draft address as primary (clears primary on all others). */

export function setClientAddressPrimary(

  addresses: ClientAddressEntry[],

  index: number

): ClientAddressEntry[] {

  if (index < 0 || index >= addresses.length || !isClientAddressActive(addresses[index])) {

    return addresses;

  }

  return addresses.map((address, i) => ({

    ...address,

    isPrimary: i === index

  }));

}



/** Clears primary on an address when it is deactivated and promotes another active address if needed. */

export function applyClientAddressActiveChange(

  addresses: ClientAddressEntry[],

  index: number,

  isActive: boolean

): ClientAddressEntry[] {

  if (index < 0 || index >= addresses.length) {

    return addresses;

  }



  let next = addresses.map((address, i) =>

    i === index ? { ...address, isActive } : address

  );



  if (!isActive && next[index].isPrimary) {

    next = next.map((address, i) => (i === index ? { ...address, isPrimary: false } : address));

    const fallbackIndex = firstActiveAddressIndex(next);

    if (fallbackIndex >= 0) {

      return setClientAddressPrimary(next, fallbackIndex);

    }

  }



  return next;

}


