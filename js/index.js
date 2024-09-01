// Declare minimum variables in root scope
const LOCAL_STORAGE_KEY = 'membership-drive-form-data';
const defaultSelectedCountry = 'pakistan';
const defaultSelectedCity = 'karachi';
const NEXT_PAGE_URL = '../en/page-2.html';

const COUNTRIES_API_URL = 'http://reports.karachijamaat.pk/api/v1/countries/list';
const CITIES_API_URL = (id) =>
  'http://reports.karachijamaat.pk/api/v1/cities/list?country_id=' + id;

const language = document.documentElement.lang;

const ERROR_MESSAGES = {
  en: {
    name: 'Name is required',
    'year-of-birth': 'Year of birth is required',
    phone: 'Please enter a valid phone number',
    email: 'Please enter a valid email address',
    country: 'Country is required',
    city: 'City is required',
    'whatsapp-number': 'Please enter a valid WhatsApp number.',
    profession: 'Profession is required',
  },
  ur: {
    name: 'نام درج کریں',
    'year-of-birth': 'سال پیدائش درج کریں',
    phone: 'براہ کرم ایک درست فون نمبر درج کریں',
    email: 'براہ کرم ایک درست ای میل پتہ درج کریں',
    country: 'ملک درج کریں',
    city: 'شہر درج کریں',
    'whatsapp-number': 'براہ کرم ایک درست واٹس ایپ نمبر درج کریں',
    profession: 'پیشہ درج کریں',
  },
};

let iti;

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  const form = document.getElementById('membership-form');

  // initialize form
  await initializeForm();

  // add submit handler to form
  form.addEventListener('submit', handleSubmit);
}

async function initializeForm() {
  const form = document.getElementById('membership-form');
  const emailElem = document.getElementById('email');
  const countryElem = document.getElementById('country');
  const cityElem = document.getElementById('city');
  const yearOfBirth = document.getElementById('year-of-birth');

  // ADD YEARS OF BIRTH TO SELECT
  const currentYear = new Date().getFullYear();

  const years = Array.from({ length: currentYear - 1960 + 1 }, (_, i) => i + 1960);
  emptyElement(yearOfBirth);
  years.forEach((year) => {
    yearOfBirth.add(new Option(year, year, false, currentYear === year));
  });

  // INITIALZE WHATSAPP NUMBER INPUT
  const whatsappNumber = document.getElementById('whatsapp-number');
  iti = window.intlTelInput(whatsappNumber, {
    utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@23.8.1/build/js/utils.js',
    strictMode: true,
    initialCountry: 'pk',
    separateDialCode: true,
    containerClass: 'intl-tel-input-wrapper',
  });

  // EMAIL ELEMENT DIRECTION MODE
  emailElem.addEventListener('input', handleEmailInput);

  // COUNTRY ELEMENT
  countryElem.setAttribute('disabled', 'true');
  const countries = await fetchApiData(COUNTRIES_API_URL);
  let defaultCountry = null;
  emptyElement(countryElem);
  countries.forEach((country) => {
    const option = new Option(country.name, country.name);
    option.setAttribute('data-id', country.id);
    if (country.name.toLowerCase() === defaultSelectedCountry) {
      defaultCountry = country;
      option.setAttribute('selected', 'true');
    }
    countryElem.appendChild(option);
  });
  countryElem.addEventListener('change', handleCountryChange);
  countryElem.removeAttribute('disabled');

  // FETCH CITIES FOR DEFAULT COUNTRY
  cityElem.setAttribute('disabled', 'true');
  const cities = await fetchApiData(CITIES_API_URL(defaultCountry.id));
  emptyElement(cityElem);
  cities.forEach((city) => {
    cityElem.add(
      new Option(
        city.name,
        city.name,
        false,
        city.name.toLowerCase() === defaultSelectedCity
      )
    );
  });
  cityElem.removeAttribute('disabled');

  form.removeAttribute('hidden'); // REMOVE FORM HIDDEN ATTRIBUTE
}

function handleEmailInput(event) {
  if (language === 'ur') {
    const email = event.target.value;
    const emailElem = event.target;
    emailElem.setAttribute('dir', email.length > 0 ? 'ltr' : 'rtl');
  }
}

async function handleCountryChange(event) {
  const selectedOption = event.target.options[event.target.selectedIndex];

  // Retrieve the value, text, and custom data attribute of the selected option
  const selectedDataId = selectedOption.getAttribute('data-id');

  // FETCH CITIES FOR SELECTED COUNTRY
  const citiesElem = document.getElementById('city');
  const cities = await fetchApiData(CITIES_API_URL(selectedDataId));
  emptyElement(citiesElem);
  cities.forEach((city) => {
    const option = document.createElement('option');
    option.value = city.name;
    option.textContent = city.name;
    citiesElem.appendChild(option);
  });
  const defaultCityOption = new Option('Select Your City', '', true, true);
  defaultCityOption.setAttribute('hidden', 'true');
  citiesElem.appendChild(defaultCityOption);
}

async function handleSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const formDataObject = Object.fromEntries(formData.entries());
  formDataObject['name'] = formDataObject.name.trim();
  formDataObject['email'] = formDataObject.email.trim();
  formDataObject['whatsapp-number'] = iti.getNumber();

  const validationResult = await validateForm(formDataObject);

  if (!validationResult.isValid) {
    const errorMessages = validationResult.formErrors;
    Object.keys(errorMessages).forEach((key) => {
      const errorMessage = errorMessages[key];
      showErrorMessages(errorMessage, key);
    });
    return;
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formDataObject));
  window.location.href = NEXT_PAGE_URL;
}

function showErrorMessages(errorMessage, inputElemName) {
  const errorElemExistsInDom = document.getElementById(`${inputElemName}-error`);
  if (errorElemExistsInDom) return;

  const input = document.querySelector(`[name="${inputElemName}"]`);
  const formGroup = input.closest('.form-group');
  const errorElem = document.createElement('div');
  errorElem.classList.add('error');
  errorElem.id = `${inputElemName}-error`;
  errorElem.innerText = errorMessage;
  errorElem.setAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
  formGroup.appendChild(errorElem);
}

async function validateForm(formDataObject) {
  const formErrors = {};
  const errorMessages = ERROR_MESSAGES[language];

  // VALIDATE NAME
  if (!formDataObject.name || !formDataObject['name'].length) {
    formErrors.name = errorMessages.name;
  }

  // VALIDATE YEAR OF BIRTH
  if (!formDataObject['year-of-birth']) {
    formErrors['year-of-birth'] = errorMessages['year-of-birth'];
  }

  // VALIDATE EMAIL
  if (formDataObject.email && /\S+@\S+\.\S+/.test(formDataObject.email) === false) {
    formErrors.email = errorMessages.email;
  }

  // VALIDATE COUNTRY
  if (!formDataObject.country) {
    formErrors.country = errorMessages.country;
  }

  // VALIDATE CITY
  if (!formDataObject.city) {
    formErrors.city = errorMessages.city;
  }

  // VALIDATE WHATSAPP NUMBER
  if (!iti.isValidNumber()) {
    formErrors['whatsapp-number'] = errorMessages['whatsapp-number'];
  }

  // VALIDATE PROFESSION
  if (!formDataObject.profession) {
    formErrors.profession = errorMessages.profession;
  }

  return {
    isValid: Object.keys(formErrors).length === 0,
    formErrors,
  };
}

async function fetchApiData(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const jsonData = await response.json();
    return jsonData.data;
  } catch (error) {
    console.log(`Error fetching data from ${url}`, error);
    alert('Error fetching data from server');
  }
}

function emptyElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
