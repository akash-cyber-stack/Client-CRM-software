import { env } from '../config/env.js';

import { isValidGstinFormat, normalizeGstin } from '../utils/gstin.js';

import { maskEmail, maskPhone, normalizeIndianMobile } from '../utils/maskContact.js';



function extractContacts(info) {

  const rawMobile =

    info?.mb ||

    info?.mobile ||

    info?.mblNo ||

    info?.contactNumber ||

    info?.mobNum ||

    info?.phone ||

    info?.registeredMobile ||

    null;

  const rawEmail =

    info?.em ||

    info?.email ||

    info?.emailId ||

    info?.contactEmail ||

    info?.registeredEmail ||

    null;



  const mobile = normalizeIndianMobile(rawMobile);

  const email = rawEmail ? String(rawEmail).trim().toLowerCase() : null;



  return { mobile, email };

}



/**

 * Lookup GSTIN in registry (format + optional live API) and return registered contacts for OTP.

 */

export async function lookupGstRegistry(rawGstin) {

  const base = await verifyGstin(rawGstin);

  if (!base.valid) {

    return { ...base, mobile: null, email: null, maskedMobile: null, maskedEmail: null };

  }



  let mobile = base.mobile || null;

  let email = base.email || null;



  if (!mobile && !email && env.gstVerificationMode === 'mock') {

    mobile = normalizeIndianMobile(env.gstMockMobile) || '9876543210';

    email = env.gstMockEmail || `gst.verify+${base.gstin.slice(-4).toLowerCase()}@example.com`;

  }



  if (!mobile && !email) {

    return {

      ...base,

      valid: false,

      mobile: null,

      email: null,

      maskedMobile: null,

      maskedEmail: null,

      message:

        'GST registry did not return a registered mobile or email. Use GST_VERIFICATION_MODE=api with a licensed GST provider, or set GST_MOCK_MOBILE / GST_MOCK_EMAIL for development.',

    };

  }



  return {

    ...base,

    mobile,

    email,

    maskedMobile: maskPhone(mobile),

    maskedEmail: maskEmail(email),

    message: 'GST found in registry. Verify OTP sent to registered contact(s).',

  };

}



/**

 * Verify GSTIN: format + checksum, then optional live API (AppyFlow / custom URL).

 */

export async function verifyGstin(rawGstin) {

  const gstin = normalizeGstin(rawGstin);



  if (!gstin) {

    return { valid: false, gstin, message: 'GST number is required' };

  }



  if (!isValidGstinFormat(gstin)) {

    return {

      valid: false,

      gstin,

      message: 'Invalid GSTIN format or check digit. Enter a valid 15-character GST number.',

    };

  }



  if (env.gstVerificationMode === 'format') {

    return {

      valid: true,

      gstin,

      legalName: null,

      address: null,

      stateCode: gstin.slice(0, 2),

      mobile: null,

      email: null,

      message: 'GSTIN format verified',

      source: 'format',

    };

  }



  if (env.gstVerificationMode === 'mock') {

    const mobile = normalizeIndianMobile(env.gstMockMobile) || '9876543210';

    const email = env.gstMockEmail || `gst.verify+${gstin.slice(-4).toLowerCase()}@example.com`;

    return {

      valid: true,

      gstin,

      legalName: `Registered entity (${gstin.slice(2, 12)})`,

      address: 'Verified against GST registry (development mode)',

      stateCode: gstin.slice(0, 2),

      mobile,

      email,

      message: 'GST verified with registry contacts (development mode)',

      source: 'mock',

    };

  }



  return verifyGstinViaApi(gstin);

}



async function verifyGstinViaApi(gstin) {

  if (!env.gstApiKey && !env.gstApiUrl) {

    return {

      valid: false,

      gstin,

      message:

        'Live GST verification is not configured. Set GST_API_KEY or use GST_VERIFICATION_MODE=format for checksum-only checks.',

    };

  }



  try {

    const url = env.gstApiUrl || 'https://appyflow.in/api/verifyGST';

    const res = await fetch(url, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        ...(env.gstApiKey ? { Authorization: `Bearer ${env.gstApiKey}` } : {}),

      },

      body: JSON.stringify({

        gstNo: gstin,

        key: env.gstApiKey,

        gstin,

      }),

    });



    const data = await res.json().catch(() => ({}));



    const active =

      data?.taxpayerInfo?.sts === 'Active' ||

      data?.status === 'Active' ||

      data?.success === true ||

      data?.valid === true ||

      data?.data?.status === 'Active';



    if (!res.ok || data?.error || (data?.success === false && !active)) {

      return {

        valid: false,

        gstin,

        message: data?.message || data?.error || 'GST number could not be verified with the registry',

        raw: data,

      };

    }



    const info = data?.taxpayerInfo || data?.data || data;

    const legalName =

      info?.lgnm || info?.tradeNam || info?.legalName || info?.businessName || info?.name || null;

    const address =

      info?.pradr?.addr ||

      info?.address ||

      [info?.addrBnm, info?.addrBno, info?.addrSt, info?.addrLoc, info?.addrPncd]

        .filter(Boolean)

        .join(', ') ||

      null;



    const { mobile, email } = extractContacts(info);



    return {

      valid: true,

      gstin,

      legalName,

      address,

      stateCode: gstin.slice(0, 2),

      mobile,

      email,

      message: 'GST verified successfully with Government registry',

      source: 'api',

      raw: data,

    };

  } catch (err) {

    return {

      valid: false,

      gstin,

      message: `GST verification service unavailable: ${err.message}`,

    };

  }

}


