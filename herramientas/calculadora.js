(() => {
  'use strict';

  const DEFAULT_API_BASE = 'https://edge-prod.rentas.proper.com.pe/prod';
  const WHATSAPP_NUMBER = '51912462976';
  const GOOGLE_MAPS_JS_BASE = 'https://maps.googleapis.com/maps/api/js';
  const DISTRICT_POSTAL_FALLBACKS = Object.freeze({
    'Lince': '15046',
    'Miraflores': '15074',
    'San Isidro': '15073',
    'Santiago de Surco': '15023',
    'San Borja': '15037',
    'Barranco': '15063',
    'La Molina': '15024',
    'Jesús María': '15072',
    'Magdalena del Mar': '15086',
    'Pueblo Libre': '15084',
    'Surquillo': '15047',
    'San Miguel': '15087',
  });

  const state = {
    apiBaseUrl: DEFAULT_API_BASE,
    currentStep: 1,
    property: null,
    calculation: null,
    inmuebleId: null,
    clienteId: null,
    plannedRent: null,
    addressValidation: {
      validated: false,
      query: '',
      selected: null,
    },
    geocodeCache: new Map(),
    lastGeocodeAt: 0,
    google: {
      key: '',
      enabled: false,
      loadingPromise: null,
      autocompleteService: null,
      placesService: null,
      sessionToken: null,
    },
  };
  let addressLookupTimer = null;
  let addressLookupSeq = 0;

  const refs = {
    steps: document.getElementById('calc-steps'),
    stepSections: Array.from(document.querySelectorAll('.calc-step')),

    formProperty: document.getElementById('calc-form-property'),
    formClient: document.getElementById('calc-form-client'),

    step1Error: document.getElementById('calc-step1-error'),
    step2Error: document.getElementById('calc-step2-error'),
    step3Error: document.getElementById('calc-step3-error'),

    submitProperty: document.getElementById('calc-submit-property'),
    backToStep1: document.getElementById('calc-back-to-step1'),
    continueToStep3: document.getElementById('calc-continue-to-step3'),
    backToStep2: document.getElementById('calc-back-to-step2'),
    saveClient: document.getElementById('calc-save-client'),
    startAgain: document.getElementById('calc-start-again'),
    addressStatus: document.getElementById('address-validation-status'),
    addressSuggestions: document.getElementById('address-suggestions'),

    average: document.getElementById('calc-average'),
    comparablesCount: document.getElementById('calc-comparables-count'),
    rangeApplied: document.getElementById('calc-range-applied'),
    note: document.getElementById('calc-note'),
    comparablesBody: document.getElementById('calc-comparables-body'),

    plannedRent: document.getElementById('planned-rent'),
    recommendation: document.getElementById('calc-recommendation'),

    successSummary: document.getElementById('calc-success-summary'),
    whatsappLink: document.getElementById('calc-whatsapp-link'),

    fields: {
      address: document.getElementById('address'),
      district: document.getElementById('district'),
      postalCode: document.getElementById('postal-code-hidden'),
      area: document.getElementById('area'),
      bedrooms: document.getElementById('bedrooms'),
      bathrooms: document.getElementById('bathrooms'),
      furnished: document.getElementById('furnished'),
      parking: document.getElementById('parking'),
      range: document.getElementById('range'),
      latitude: document.getElementById('latitude'),
      longitude: document.getElementById('longitude'),
    },

    clientFields: {
      docType: document.getElementById('doc-type'),
      docNumber: document.getElementById('doc-number'),
      firstName: document.getElementById('first-name'),
      lastNameFather: document.getElementById('last-name-father'),
      lastNameMother: document.getElementById('last-name-mother'),
      email: document.getElementById('email'),
      phone: document.getElementById('phone'),
      acceptData: document.getElementById('accept-data'),
    },
  };

  if (!refs.formProperty || !refs.formClient) {
    return;
  }

  init();

  function init() {
    state.apiBaseUrl = resolveApiBaseUrl();
    state.google.key = resolveGoogleMapsApiKey();
    state.google.enabled = Boolean(state.google.key);

    if (state.google.enabled) {
      ensureGoogleMapsReady().catch(() => {
        // Silently fallback to ArcGIS geocoding when Google Maps is unavailable.
      });
    }

    refs.formProperty.addEventListener('submit', onPropertySubmit);
    refs.formClient.addEventListener('submit', onClientSubmit);

    refs.backToStep1.addEventListener('click', () => setStep(1));
    refs.backToStep2.addEventListener('click', () => setStep(2));
    refs.continueToStep3.addEventListener('click', onContinueToStep3);
    refs.startAgain.addEventListener('click', resetCalculator);

    refs.plannedRent.addEventListener('input', updateRecommendation);
    refs.fields.address.addEventListener('input', onAddressFieldChanged);
    refs.fields.district.addEventListener('change', onAddressFieldChanged);
    setAddressStatus('Escribe una dirección y te sugerimos ubicaciones en tiempo real.', 'idle');
    setStep(1);
  }

  function onAddressFieldChanged() {
    const address = refs.fields.address.value.trim();
    const district = (refs.fields.district.value || 'Lince').trim();
    const hasAddress = address.length >= 3;
    const hasDistrict = district.length > 0;

    state.addressValidation.validated = false;
    state.addressValidation.query = '';
    state.addressValidation.selected = null;
    refs.fields.postalCode.value = '';
    refs.fields.latitude.value = '';
    refs.fields.longitude.value = '';
    clearTimeout(addressLookupTimer);
    refs.addressSuggestions.hidden = true;
    refs.addressSuggestions.innerHTML = '';

    if (!hasAddress || !hasDistrict) {
      setAddressStatus('Escribe una dirección y te sugerimos ubicaciones en tiempo real.', 'idle');
      return;
    }

    setAddressStatus('Validando dirección automáticamente en Lima, Perú...', 'pending');
    if (state.google.enabled && !state.google.sessionToken && window.google?.maps?.places?.AutocompleteSessionToken) {
      rotateGoogleSessionToken();
    }
    const currentSeq = ++addressLookupSeq;
    addressLookupTimer = setTimeout(() => {
      autoLookupAddress(address, district, currentSeq);
    }, 350);
  }

  async function autoLookupAddress(address, district, seq) {
    try {
      const results = await geocodeAddressOptions(address, district);

      if (seq !== addressLookupSeq) {
        return;
      }

      if (!results.length) {
        setAddressStatus('No encontramos coincidencias. Prueba con calle, número y distrito (ej: Av. Arequipa 1415, Lince).', 'error');
        refs.addressSuggestions.hidden = true;
        return;
      }

      renderAddressSuggestions(results, address, district);
      applyAddressCandidate(results[0], {
        replaceAddress: false,
        sourceAddress: address,
        sourceDistrict: district,
      });
      setAddressStatus(`${results.length} sugerencias encontradas. Selecciona la dirección correcta.`, 'ok');
    } catch (_) {
      if (seq !== addressLookupSeq) {
        return;
      }
      setAddressStatus('No pudimos cargar sugerencias en este momento. Sigue escribiendo e intenta de nuevo.', 'error');
    }
  }

  function resolveApiBaseUrl() {
    const url = new URL(window.location.href);
    const queryParam = url.searchParams.get('apiBase');

    if (queryParam && isValidUrl(queryParam)) {
      const cleaned = stripTrailingSlash(queryParam);
      window.localStorage.setItem('calcApiBaseUrl', cleaned);
      return cleaned;
    }

    const stored = window.localStorage.getItem('calcApiBaseUrl');
    if (stored && isValidUrl(stored)) {
      return stripTrailingSlash(stored);
    }

    return DEFAULT_API_BASE;
  }

  function resolveGoogleMapsApiKey() {
    const url = new URL(window.location.href);
    const queryParam = (url.searchParams.get('gmapsKey') || '').trim();
    if (queryParam) {
      window.localStorage.setItem('calcGoogleMapsApiKey', queryParam);
      return queryParam;
    }

    const fromConfig = (window.__ALQUILASEGURO_CONFIG?.googleMapsApiKey || '').trim();
    if (fromConfig) {
      return fromConfig;
    }

    const stored = (window.localStorage.getItem('calcGoogleMapsApiKey') || '').trim();
    return stored;
  }

  function ensureGoogleMapsReady() {
    if (!state.google.enabled || !state.google.key) {
      return Promise.resolve(false);
    }

    if (window.google?.maps?.places?.AutocompleteService) {
      bootstrapGoogleServices();
      return Promise.resolve(true);
    }

    if (state.google.loadingPromise) {
      return state.google.loadingPromise;
    }

    state.google.loadingPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-maps-loader=\"true\"]');
      if (existing) {
        existing.addEventListener('load', () => {
          try {
            bootstrapGoogleServices();
            resolve(true);
          } catch (error) {
            reject(error);
          }
        }, { once: true });
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Maps JS')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.dataset.googleMapsLoader = 'true';
      script.src = `${GOOGLE_MAPS_JS_BASE}?key=${encodeURIComponent(state.google.key)}&libraries=places&language=es&region=PE`;
      script.onload = () => {
        try {
          bootstrapGoogleServices();
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = () => reject(new Error('No se pudo cargar Google Maps JS'));
      document.head.appendChild(script);
    }).catch(() => false);

    return state.google.loadingPromise;
  }

  function bootstrapGoogleServices() {
    if (!window.google?.maps?.places) {
      throw new Error('Google Places no disponible');
    }

    if (!state.google.autocompleteService) {
      state.google.autocompleteService = new window.google.maps.places.AutocompleteService();
    }

    if (!state.google.placesService) {
      const dummy = document.createElement('div');
      state.google.placesService = new window.google.maps.places.PlacesService(dummy);
    }

    if (!state.google.sessionToken && window.google.maps.places.AutocompleteSessionToken) {
      state.google.sessionToken = new window.google.maps.places.AutocompleteSessionToken();
    }
  }

  function rotateGoogleSessionToken() {
    if (!window.google?.maps?.places?.AutocompleteSessionToken) {
      return;
    }
    state.google.sessionToken = new window.google.maps.places.AutocompleteSessionToken();
  }

  function stripTrailingSlash(value) {
    return value.replace(/\/+$/, '');
  }

  function isValidUrl(value) {
    try {
      const candidate = new URL(value);
      return candidate.protocol === 'http:' || candidate.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  async function onPropertySubmit(event) {
    event.preventDefault();
    hideError(refs.step1Error);

    try {
      setLoading(refs.submitProperty, true, 'Calculando...');

      const propertyData = collectPropertyData();
      propertyData.postalCode = normalizePostal(
        propertyData.postalCode || getPostalFallbackFromDistrict(propertyData.district) || ''
      );
      await ensureCoordinates(propertyData);

      let payload = buildCalculationPayload(propertyData);
      payload.codigo_postal = normalizePostal(
        payload.codigo_postal || getPostalFallbackFromDistrict(propertyData.district) || ''
      );
      if (!String(payload.codigo_postal || '').trim()) {
        throw new Error('No se pudo determinar el código postal. Selecciona una sugerencia de dirección y vuelve a intentar.');
      }
      let calculation;
      try {
        calculation = await request('/calculadora/calcular-renta-promedio/', {
          method: 'POST',
          body: payload,
        });
      } catch (error) {
        const errorText = normalizeText(normalizeError(error));
        if (errorText.includes('codigo_postal')) {
          payload = {
            ...payload,
            codigo_postal: normalizePostal(
              payload.codigo_postal ||
              propertyData.postalCode ||
              refs.fields.postalCode?.value ||
              getPostalFallbackFromDistrict(propertyData.district)
            ),
          };
          calculation = await request('/calculadora/calcular-renta-promedio/', {
            method: 'POST',
            body: payload,
          });
        } else {
          throw error;
        }
      }

      state.property = propertyData;
      state.calculation = calculation;

      renderCalculationResult(calculation, propertyData);
      await createInmuebleRecord(propertyData, calculation);

      setStep(2);
    } catch (error) {
      showError(refs.step1Error, normalizeError(error));
    } finally {
      setLoading(refs.submitProperty, false, 'Calcular ahora');
    }
  }

  async function onContinueToStep3() {
    hideError(refs.step2Error);

    try {
      await persistPlannedRent();
      setStep(3);
    } catch (error) {
      showError(refs.step2Error, normalizeError(error));
    }
  }

  async function onClientSubmit(event) {
    event.preventDefault();
    hideError(refs.step3Error);

    try {
      const clientData = collectClientData();
      setLoading(refs.saveClient, true, 'Guardando...');

      const clientResponse = await request('/calculadora/cliente/crear-u-obtener/', {
        method: 'POST',
        body: {
          tipo_doc: clientData.docType,
          nro_doc: clientData.docNumber,
          nombres: clientData.firstName,
          ape_paterno: clientData.lastNameFather,
          ape_materno: clientData.lastNameMother,
          emails: [clientData.email],
          telefonos: [clientData.phone],
        },
      });

      state.clienteId = clientResponse?.data?.id || null;

      if (state.inmuebleId && state.clienteId) {
        await request('/calculadora/historico/crear/', {
          method: 'POST',
          body: {
            cliente_id: state.clienteId,
            inmueble_id: state.inmuebleId,
          },
        });
      }

      await persistPlannedRent();
      renderSuccess(clientData);
      setStep(4);
    } catch (error) {
      showError(refs.step3Error, normalizeError(error));
    } finally {
      setLoading(refs.saveClient, false, 'Guardar y finalizar');
    }
  }

  function collectPropertyData() {
    const data = {
      address: refs.fields.address.value.trim(),
      district: refs.fields.district.value.trim() || 'Lince',
      postalCode: normalizePostal(refs.fields.postalCode?.value || ''),
      area: Number(refs.fields.area.value),
      bedrooms: Number(refs.fields.bedrooms.value),
      bathrooms: Number(refs.fields.bathrooms.value),
      furnished: refs.fields.furnished.value === 'true',
      parking: refs.fields.parking.value === 'true',
      range: Number(refs.fields.range.value),
      latitude: refs.fields.latitude.value.trim(),
      longitude: refs.fields.longitude.value.trim(),
    };

    if (!data.address) {
      throw new Error('Ingresa la dirección del inmueble.');
    }

    if (!data.district) {
      throw new Error('Selecciona el distrito del inmueble.');
    }

    if (!Number.isFinite(data.area) || data.area <= 0) {
      throw new Error('Ingresa un metraje válido.');
    }

    return data;
  }

  function collectClientData() {
    const data = {
      docType: refs.clientFields.docType.value.trim() || 'DNI',
      docNumber: refs.clientFields.docNumber.value.trim(),
      firstName: refs.clientFields.firstName.value.trim(),
      lastNameFather: refs.clientFields.lastNameFather.value.trim(),
      lastNameMother: refs.clientFields.lastNameMother.value.trim(),
      email: refs.clientFields.email.value.trim().toLowerCase(),
      phone: refs.clientFields.phone.value.trim(),
      acceptData: refs.clientFields.acceptData.checked,
    };

    if (!data.docNumber) {
      throw new Error('Ingresa el número de documento.');
    }

    if (!data.firstName || !data.lastNameFather || !data.lastNameMother) {
      throw new Error('Completa nombres y apellidos.');
    }

    if (!isValidEmail(data.email)) {
      throw new Error('Ingresa un correo válido.');
    }

    if (!data.phone || data.phone.replace(/[^0-9]/g, '').length < 7) {
      throw new Error('Ingresa un teléfono válido.');
    }

    if (!data.acceptData) {
      throw new Error('Debes aceptar el tratamiento de datos para continuar.');
    }

    return data;
  }

  async function ensureCoordinates(propertyData) {
    if (propertyData.latitude && propertyData.longitude) {
      const lat = Number(propertyData.latitude);
      const lng = Number(propertyData.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('No pudimos validar la ubicación del inmueble. Revisa la dirección e inténtalo nuevamente.');
      }
      state.addressValidation.validated = true;
      state.addressValidation.selected = {
        displayName: propertyData.address,
        lat,
        lng,
      };
      state.addressValidation.query = buildAddressQuery(propertyData.address, propertyData.district);
      if (!propertyData.postalCode) {
        propertyData.postalCode = normalizePostal(state.addressValidation.selected?.postalCode || '');
      }
      if (!propertyData.postalCode) {
        propertyData.postalCode = await resolvePostalCodeFromCoordinates(lat, lng);
      }
      if (!propertyData.postalCode) {
        propertyData.postalCode = getPostalFallbackFromDistrict(propertyData.district);
      }
      if (!propertyData.postalCode) {
        throw new Error('No pudimos identificar el código postal de la dirección. Selecciona una sugerencia más precisa.');
      }
      setAddressStatus('Ubicación validada correctamente.', 'ok');
      return;
    }

    const query = buildAddressQuery(propertyData.address, propertyData.district);
    if (
      state.addressValidation.validated &&
      state.addressValidation.query === query &&
      state.addressValidation.selected &&
      Number.isFinite(state.addressValidation.selected.lat) &&
      Number.isFinite(state.addressValidation.selected.lng)
    ) {
      propertyData.latitude = String(state.addressValidation.selected.lat);
      propertyData.longitude = String(state.addressValidation.selected.lng);
      propertyData.postalCode = normalizePostal(state.addressValidation.selected.postalCode || propertyData.postalCode || '');
      if (!propertyData.postalCode) {
        propertyData.postalCode = await resolvePostalCodeFromCoordinates(
          state.addressValidation.selected.lat,
          state.addressValidation.selected.lng
        );
      }
      if (!propertyData.postalCode) {
        propertyData.postalCode = getPostalFallbackFromDistrict(propertyData.district);
      }
      if (!propertyData.postalCode) {
        throw new Error('No pudimos identificar el código postal de la dirección. Selecciona una sugerencia más precisa.');
      }
      return;
    }

    const options = await geocodeAddressOptions(propertyData.address, propertyData.district);
    if (!options.length) {
      throw new Error('No pudimos ubicar esa dirección. Verifica la calle, número y distrito para continuar.');
    }

    const best = options[0];
    applyAddressCandidate(best, {
      replaceAddress: false,
      sourceAddress: propertyData.address,
      sourceDistrict: propertyData.district,
    });
    propertyData.latitude = String(best.lat);
    propertyData.longitude = String(best.lng);
    propertyData.postalCode = normalizePostal(best.postalCode || propertyData.postalCode || '');
    if (!propertyData.postalCode) {
      propertyData.postalCode = await resolvePostalCodeFromCoordinates(best.lat, best.lng);
    }
    if (!propertyData.postalCode) {
      propertyData.postalCode = getPostalFallbackFromDistrict(propertyData.district);
    }
    if (!propertyData.postalCode) {
      throw new Error('No pudimos identificar el código postal de la dirección. Selecciona una sugerencia más precisa.');
    }
    setAddressStatus('Dirección validada automáticamente.', 'ok');
  }

  async function geocodeAddressOptions(address, district) {
    if (!address || address.trim().length < 3) {
      return [];
    }

    const googleReady = await ensureGoogleMapsReady();
    if (googleReady) {
      const googleCandidates = await fetchGoogleAddressCandidates(address, district);
      if (googleCandidates.length) {
        return rankAddressCandidates(googleCandidates, address, district).slice(0, 6);
      }
    }

    const queries = buildAddressQueries(address, district);
    const collected = [];
    const seen = new Set();

    for (const query of queries) {
      const cacheKey = normalizeText(query);
      let candidates = state.geocodeCache.get(cacheKey);

      if (!candidates) {
        candidates = await fetchArcgisAddressCandidates(query);
        state.geocodeCache.set(cacheKey, candidates);
      }

      for (const candidate of candidates) {
        const dedupeKey = `${candidate.lat.toFixed(6)},${candidate.lng.toFixed(6)}:${normalizeText(candidate.displayName)}`;
        if (seen.has(dedupeKey)) {
          continue;
        }
        seen.add(dedupeKey);
        collected.push(candidate);
      }

      if (collected.length >= 8) {
        break;
      }
    }

    return rankAddressCandidates(collected, address, district).slice(0, 6);
  }

  async function fetchGoogleAddressCandidates(address, district) {
    if (!state.google.autocompleteService || !state.google.placesService) {
      return [];
    }

    const input = `${address}, ${district || 'Lima'}, Lima, Perú`;
    const predictions = await new Promise((resolve) => {
      state.google.autocompleteService.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'pe' },
          language: 'es',
          types: ['address'],
          sessionToken: state.google.sessionToken || undefined,
        },
        (items, status) => {
          const okStatus = window.google?.maps?.places?.PlacesServiceStatus?.OK;
          const zeroStatus = window.google?.maps?.places?.PlacesServiceStatus?.ZERO_RESULTS;
          if (status === okStatus || status === zeroStatus) {
            resolve(Array.isArray(items) ? items : []);
            return;
          }
          resolve([]);
        }
      );
    });

    if (!predictions.length) {
      return [];
    }

    const topPredictions = predictions.slice(0, 6);
    const candidates = [];

    for (const prediction of topPredictions) {
      const detail = await fetchGooglePlaceDetails(prediction.place_id);
      if (!detail) {
        continue;
      }
      candidates.push({
        displayName: detail.displayName || prediction.description || '',
        lat: detail.lat,
        lng: detail.lng,
        importance: Math.max(0, (100 - Number(prediction?.distance_meters || 0)) / 100),
        postalCode: detail.postalCode,
        district: detail.district,
        addrType: 'PointAddress',
      });
    }

    return candidates.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng) && item.displayName);
  }

  async function fetchGooglePlaceDetails(placeId) {
    if (!placeId || !state.google.placesService) {
      return null;
    }

    const detail = await new Promise((resolve) => {
      state.google.placesService.getDetails(
        {
          placeId,
          fields: ['formatted_address', 'geometry.location', 'address_components'],
          language: 'es',
          region: 'pe',
          sessionToken: state.google.sessionToken || undefined,
        },
        (result, status) => {
          const okStatus = window.google?.maps?.places?.PlacesServiceStatus?.OK;
          if (status !== okStatus || !result?.geometry?.location) {
            resolve(null);
            return;
          }
          resolve(result);
        }
      );
    });

    if (!detail) {
      return null;
    }

    const components = Array.isArray(detail.address_components) ? detail.address_components : [];
    const postalCode = findGoogleAddressComponent(components, 'postal_code');
    const district = (
      findGoogleAddressComponent(components, 'sublocality_level_1') ||
      findGoogleAddressComponent(components, 'locality') ||
      findGoogleAddressComponent(components, 'administrative_area_level_2') ||
      ''
    ).trim();

    return {
      displayName: detail.formatted_address || '',
      lat: Number(detail.geometry.location.lat()),
      lng: Number(detail.geometry.location.lng()),
      postalCode: normalizePostal(postalCode),
      district,
    };
  }

  function findGoogleAddressComponent(components, type) {
    if (!Array.isArray(components)) {
      return '';
    }
    const found = components.find((component) => Array.isArray(component.types) && component.types.includes(type));
    return found?.long_name || '';
  }

  async function fetchArcgisAddressCandidates(query) {
    await waitForNominatimWindow();

    const endpoint =
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates` +
      `?f=pjson&SingleLine=${encodeURIComponent(query)}&countryCode=PER&maxLocations=8&outFields=*`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Servicio de validación de dirección no disponible.');
    }

    const results = await response.json();
    const items = Array.isArray(results?.candidates) ? results.candidates : [];

    return items
      .map((item) => ({
        displayName: item.address || '',
        lat: Number(item?.location?.y),
        lng: Number(item?.location?.x),
        importance: Number(item.score || 0) / 100,
        postalCode: normalizePostal(item?.attributes?.Postal || extractPostalFromText(item.address || '')),
        district: resolveDistrictFromCandidate(
          item?.attributes?.District || item?.attributes?.City || item?.address || ''
        ),
        addrType: String(item?.attributes?.Addr_type || '').trim(),
      }))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng) && item.displayName);
  }

  async function waitForNominatimWindow() {
    const now = Date.now();
    const elapsed = now - state.lastGeocodeAt;
    const minWindowMs = 280;
    if (elapsed < minWindowMs) {
      await new Promise((resolve) => setTimeout(resolve, minWindowMs - elapsed));
    }
    state.lastGeocodeAt = Date.now();
  }

  function buildAddressQuery(address, district) {
    const safeDistrict = district && district.trim() ? district.trim() : 'Lince';
    return `${address}, ${safeDistrict}, Lima, Peru`;
  }

  function buildAddressQueries(address, district) {
    const cleanAddress = (address || '').replace(/\s+/g, ' ').trim();
    const safeDistrict = (district || '').trim();
    const variants = [
      `${cleanAddress}, Lima, Peru`,
      safeDistrict ? `${cleanAddress}, ${safeDistrict}, Lima, Peru` : '',
      `${cleanAddress}, Peru`,
    ];

    const unique = [];
    const seen = new Set();
    variants.forEach((variant) => {
      if (!variant) {
        return;
      }
      const key = normalizeText(variant);
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      unique.push(variant);
    });
    return unique;
  }

  function rankAddressCandidates(candidates, address, district) {
    const addressNeedle = normalizeText(address || '');
    const districtNeedle = normalizeText(district || '');
    const inputHasNumber = /\d/.test(address || '');

    let workingSet = [...candidates];
    if (inputHasNumber) {
      const addressLike = workingSet.filter((candidate) => {
        const hasNumberInCandidate = /\d/.test(candidate.displayName || '');
        const isStreetLike = ['PointAddress', 'StreetAddress', 'StreetName'].includes(candidate.addrType);
        return hasNumberInCandidate || isStreetLike;
      });
      if (addressLike.length) {
        workingSet = addressLike;
      }
    }

    const scored = workingSet.map((candidate) => {
      const haystack = normalizeText(candidate.displayName);
      let score = Number(candidate.importance || 0);

      if (addressNeedle && haystack.includes(addressNeedle)) {
        score += 3;
      }

      if (districtNeedle && haystack.includes(districtNeedle)) {
        score += 1.3;
      }

      if (haystack.includes('lima')) {
        score += 0.6;
      }

      if (haystack.startsWith(addressNeedle)) {
        score += 0.5;
      }

      if (candidate.addrType === 'Locality') {
        score -= 0.9;
      }

      if (!/\d/.test(candidate.displayName || '') && inputHasNumber) {
        score -= 0.8;
      }

      return { ...candidate, __score: score };
    });

    return scored
      .sort((a, b) => b.__score - a.__score || b.importance - a.importance)
      .map(({ __score, ...rest }) => rest);
  }

  function normalizeText(value) {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function renderAddressSuggestions(options, sourceAddress, sourceDistrict) {
    refs.addressSuggestions.innerHTML = '';
    refs.addressSuggestions.hidden = false;

    options.slice(0, 4).forEach((option, index) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calc-address-option';
      button.textContent = option.displayName;
      button.addEventListener('click', () => {
        applyAddressCandidate(option, {
          replaceAddress: true,
          sourceAddress: option.displayName,
          sourceDistrict,
        });
        refs.addressSuggestions.hidden = true;
        setAddressStatus('Dirección seleccionada y validada.', 'ok');
      });
      li.appendChild(button);
      refs.addressSuggestions.appendChild(li);
    });
  }

  function applyAddressCandidate(option, config = {}) {
    const replaceAddress = config.replaceAddress !== false;
    const sourceAddress = (config.sourceAddress || refs.fields.address.value || option.displayName || '').trim();
    const sourceDistrict = (config.sourceDistrict || refs.fields.district.value || 'Lince').trim();

    if (replaceAddress) {
      refs.fields.address.value = option.displayName;
    }

    refs.fields.latitude.value = String(option.lat);
    refs.fields.longitude.value = String(option.lng);
    refs.fields.postalCode.value = normalizePostal(option.postalCode || extractPostalFromText(option.displayName));
    syncDistrictFromCandidate(option.district, option.displayName);
    if (!refs.fields.postalCode.value) {
      refs.fields.postalCode.value = getPostalFallbackFromDistrict(refs.fields.district.value);
    }
    state.addressValidation.validated = true;
    state.addressValidation.selected = option;
    state.addressValidation.query = buildAddressQuery(sourceAddress, sourceDistrict);
    rotateGoogleSessionToken();
  }

  function syncDistrictFromCandidate(candidateDistrict, displayName = '') {
    if (!refs.fields.district) {
      return;
    }

    const direct = resolveDistrictFromCandidate(candidateDistrict);
    const inferred = resolveDistrictFromCandidate(displayName);
    const targetDistrict = direct || inferred;

    if (targetDistrict) {
      refs.fields.district.value = targetDistrict;
      refs.fields.postalCode.value = normalizePostal(
        refs.fields.postalCode.value || getPostalFallbackFromDistrict(targetDistrict)
      );
      return;
    }
  }

  function resolveDistrictFromCandidate(value) {
    const raw = String(value || '').trim();
    if (!raw || !refs.fields.district) {
      return '';
    }

    const options = Array.from(refs.fields.district.options);
    const normalizedRaw = normalizeText(raw);

    let matched = options.find((item) => normalizeText(item.value) === normalizedRaw);
    if (matched) {
      return matched.value;
    }

    matched = options.find((item) => normalizedRaw.includes(normalizeText(item.value)));
    if (matched) {
      return matched.value;
    }

    const parts = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    for (const part of parts) {
      const normalizedPart = normalizeText(part);
      const matchByPart = options.find((item) => normalizeText(item.value) === normalizedPart);
      if (matchByPart) {
        return matchByPart.value;
      }
    }

    return '';
  }

  function extractPostalFromText(text) {
    const match = String(text || '').match(/\b(\d{5})\b/);
    return match ? match[1] : '';
  }

  function normalizePostal(value) {
    return String(value || '')
      .trim()
      .replace(/[^0-9]/g, '')
      .slice(0, 5);
  }

  function getPostalFallbackFromDistrict(district) {
    const cleanDistrict = String(district || '').trim();
    if (!cleanDistrict) {
      return '';
    }
    const direct = DISTRICT_POSTAL_FALLBACKS[cleanDistrict];
    if (direct) {
      return direct;
    }
    const normalizedDistrict = normalizeText(cleanDistrict);
    const key = Object.keys(DISTRICT_POSTAL_FALLBACKS).find(
      (item) => normalizeText(item) === normalizedDistrict
    );
    return key ? DISTRICT_POSTAL_FALLBACKS[key] : '';
  }

  async function resolvePostalCodeFromCoordinates(lat, lng) {
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      return '';
    }

    await waitForNominatimWindow();

    const endpoint =
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode` +
      `?f=pjson&location=${encodeURIComponent(`${lng},${lat}`)}&langCode=ESP`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return '';
    }

    const data = await response.json();
    return normalizePostal(data?.address?.Postal || data?.address?.PostalExt || extractPostalFromText(data?.address?.LongLabel || ''));
  }

  function setAddressStatus(message, kind = 'idle') {
    if (!refs.addressStatus) {
      return;
    }
    refs.addressStatus.textContent = message;
    refs.addressStatus.classList.remove('is-ok', 'is-error', 'is-pending');
    if (kind === 'ok') {
      refs.addressStatus.classList.add('is-ok');
      return;
    }
    if (kind === 'error') {
      refs.addressStatus.classList.add('is-error');
      return;
    }
    if (kind === 'pending') {
      refs.addressStatus.classList.add('is-pending');
    }
  }

  function buildCalculationPayload(propertyData) {
    const resolvedPostalCode = normalizePostal(
      propertyData.postalCode ||
      getPostalFallbackFromDistrict(propertyData.district) ||
      refs.fields.postalCode?.value ||
      ''
    );
    return {
      ubicacion_inmueble: propertyData.address,
      distrito: propertyData.district,
      codigo_postal: resolvedPostalCode,
      latitud_im: Number(propertyData.latitude),
      longitud_im: Number(propertyData.longitude),
      cant_banos: propertyData.bathrooms,
      cant_habitaciones: propertyData.bedrooms,
      is_amoblado: propertyData.furnished,
      is_cochera: propertyData.parking,
      metraje: Number(propertyData.area),
      ampliar_rango: propertyData.range,
      isAdminPanel: 2,
    };
  }

  function renderCalculationResult(calculation, propertyData) {
    const averageRent = Number(calculation.promedio_renta || 0);

    refs.average.textContent = toCurrency(averageRent);
    refs.comparablesCount.textContent = String(calculation.inmuebles_encontrados || 0);
    refs.rangeApplied.textContent = `${propertyData.range} km`;
    refs.note.textContent =
      calculation.note || calculation.message || 'Consulta calculada con data real de comparables.';

    refs.plannedRent.value = String(Math.max(averageRent, 0));
    updateRecommendation();

    renderComparables(calculation.inmuebles_detalle || []);
  }

  function renderComparables(items) {
    refs.comparablesBody.innerHTML = '';

    if (!items.length) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="6">No se encontraron inmuebles de referencia para esta consulta.</td>';
      refs.comparablesBody.appendChild(row);
      return;
    }

    items.slice(0, 10).forEach((item) => {
      const row = document.createElement('tr');
      const rentValue = Number(item.renta_convertida || item.renta || 0);
      row.innerHTML = `
        <td>${escapeHtml(item.direccion || 'Sin dirección')}</td>
        <td>${toCurrency(rentValue)}</td>
        <td>${safeText(item.nro_dormitorios)}</td>
        <td>${safeText(item.nro_banos)}</td>
        <td>${escapeHtml(item.is_amoblado || '-')}</td>
        <td>${escapeHtml(item.is_cochera || '-')}</td>
      `;
      refs.comparablesBody.appendChild(row);
    });
  }

  async function createInmuebleRecord(propertyData, calculation) {
    state.inmuebleId = null;
    hideError(refs.step2Error);

    try {
      const inmuebleResponse = await request('/calculadora/inmueble/crear/', {
        method: 'POST',
        body: {
          ubicacion_inmueble: propertyData.address,
          codigo_postal: normalizePostal(
            propertyData.postalCode ||
            getPostalFallbackFromDistrict(propertyData.district) ||
            refs.fields.postalCode?.value ||
            ''
          ),
          distrito: propertyData.district,
          latitud: Number(propertyData.latitude),
          longitud: Number(propertyData.longitude),
          metraje: Number(propertyData.area),
          cant_banos: propertyData.bathrooms,
          cant_habitaciones: propertyData.bedrooms,
          is_amoblado: propertyData.furnished,
          is_cochera: propertyData.parking,
          inmuebles_referencia: Number(calculation.inmuebles_encontrados || 0),
          promedio_alquiler: Number(calculation.promedio_renta || 0),
        },
      });

      state.inmuebleId = inmuebleResponse?.data?.id || null;
    } catch (error) {
      console.error('No se pudo guardar la consulta', error);
      showError(refs.step2Error, 'Obtuvimos el cálculo, pero hubo un problema al guardar la consulta. Puedes continuar de todas formas.');
    }
  }

  async function persistPlannedRent() {
    const planned = Number(refs.plannedRent.value);

    if (!Number.isFinite(planned) || planned < 0) {
      throw new Error('Ingresa un valor válido en "Alquiler que deseas publicar".');
    }

    state.plannedRent = planned;

    if (!state.inmuebleId) {
      return;
    }

    await request('/calculadora/historico/actualizar-alquiler-previsto/', {
      method: 'PUT',
      body: {
        inmueble_id: state.inmuebleId,
        alquiler_previsto: planned,
      },
    });
  }

  function updateRecommendation() {
    const average = Number(state.calculation?.promedio_renta || 0);
    const planned = Number(refs.plannedRent.value);

    if (!Number.isFinite(average) || average <= 0 || !Number.isFinite(planned)) {
      refs.recommendation.value = 'Aún sin recomendación';
      return;
    }

    const deltaRatio = (planned - average) / average;

    if (Math.abs(deltaRatio) <= 0.07) {
      refs.recommendation.value = 'Rango sano para salida comercial.';
      return;
    }

    if (deltaRatio > 0.07 && deltaRatio <= 0.15) {
      refs.recommendation.value = 'Precio algo alto; valida demanda inicial.';
      return;
    }

    if (deltaRatio > 0.15) {
      refs.recommendation.value = 'Precio alto; podrías aumentar vacancia.';
      return;
    }

    if (deltaRatio < -0.1) {
      refs.recommendation.value = 'Precio bajo; revisa si puedes capturar más renta.';
      return;
    }

    refs.recommendation.value = 'Precio competitivo para captar contactos rápido.';
  }

  function renderSuccess(clientData) {
    const average = Number(state.calculation?.promedio_renta || 0);
    const planned = Number(state.plannedRent || average || 0);

    refs.successSummary.textContent =
      `Gracias ${clientData.firstName}. Guardamos tu consulta (${state.property?.district || 'Lima'}) con alquiler estimado ${toCurrency(average)} y objetivo ${toCurrency(planned)}.`;

    const whatsappMessage = encodeURIComponent(
      `Hola, soy ${clientData.firstName}. Vengo de la calculadora de AlquilaSeguro. ` +
      `Mi estimado fue ${toCurrency(average)} y deseo publicar en ${toCurrency(planned)}. ` +
      `Distrito: ${state.property?.district || ''}. Quiero asesoría para alquilar rápido y seguro.`
    );

    refs.whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;
  }

  function setStep(step) {
    state.currentStep = step;

    refs.stepSections.forEach((section) => {
      const sectionStep = Number(section.dataset.step);
      const isVisible = sectionStep === step;
      section.hidden = !isVisible;
      section.classList.toggle('is-active', isVisible);
    });

    if (refs.steps) {
      Array.from(refs.steps.querySelectorAll('[data-step-indicator]')).forEach((item) => {
        const itemStep = Number(item.dataset.stepIndicator);
        item.classList.toggle('is-active', itemStep === step);
        item.classList.toggle('is-complete', itemStep < step);
      });
    }
  }

  function resetCalculator() {
    state.currentStep = 1;
    state.property = null;
    state.calculation = null;
    state.inmuebleId = null;
    state.clienteId = null;
    state.plannedRent = null;
    state.addressValidation.validated = false;
    state.addressValidation.query = '';
    state.addressValidation.selected = null;
    state.google.sessionToken = null;
    clearTimeout(addressLookupTimer);

    refs.formProperty.reset();
    refs.formClient.reset();

    refs.average.textContent = 'S/ --';
    refs.comparablesCount.textContent = '--';
    refs.rangeApplied.textContent = '--';
    refs.note.textContent = '';
    refs.recommendation.value = '';
    refs.plannedRent.value = '';
    refs.addressSuggestions.hidden = true;
    refs.addressSuggestions.innerHTML = '';
    setAddressStatus('Escribe una dirección y te sugerimos ubicaciones en tiempo real.', 'idle');

    refs.comparablesBody.innerHTML = '<tr><td colspan="6">Aún no hay datos para mostrar.</td></tr>';

    hideError(refs.step1Error);
    hideError(refs.step2Error);
    hideError(refs.step3Error);

    setStep(1);
  }

  async function request(path, options = {}, timeout = 15000) {
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    if (options.body !== undefined) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetchWithTimeout(`${state.apiBaseUrl}${path}`, config, timeout);

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : {};
    }

    if (!response.ok) {
      const err = new Error(data?.error || data?.message || `HTTP ${response.status}`);
      err.status = response.status;
      err.payload = data;
      throw err;
    }

    return data;
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {
      ...options,
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });
  }

  function setLoading(button, isLoading, loadingLabel) {
    if (!button) {
      return;
    }
    button.disabled = isLoading;
    if (isLoading) {
      button.dataset.originalLabel = button.textContent;
      button.textContent = loadingLabel;
    } else if (button.dataset.originalLabel) {
      button.textContent = button.dataset.originalLabel;
      delete button.dataset.originalLabel;
    }
  }

  function showError(node, message) {
    if (!node) {
      return;
    }
    node.textContent = message;
    node.hidden = false;
  }

  function hideError(node) {
    if (!node) {
      return;
    }
    node.textContent = '';
    node.hidden = true;
  }

  function normalizeError(error) {
    if (!error) {
      return 'Ocurrió un error inesperado.';
    }

    if (error.name === 'AbortError') {
      return 'La solicitud tardó demasiado. Inténtalo de nuevo.';
    }

    if (error.payload?.error) {
      return String(error.payload.error);
    }

    if (error.payload?.message) {
      return String(error.payload.message);
    }

    return error.message || 'Ocurrió un error inesperado.';
  }

  function toCurrency(value) {
    const amount = Number(value || 0);
    return `S/ ${Math.round(amount).toLocaleString('es-PE')}`;
  }

  function safeText(value) {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return escapeHtml(String(value));
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
})();
