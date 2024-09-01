const LOCAL_STORAGE_KEY = 'membership-drive-form-data';
const API_URL = 'https://reports.karachijamaat.pk/api/v1/membership';
const NEXT_PAGE_URL = (id) => '../en/download-membership-card.html?id=' + id;

const ACTIVITIES = [
  {
    en: 'Local issues (such as street cleaning, water supply, sewage, park maintenance, and management of sports grounds, etc.)',
    ur: 'مقامی مسائل (جیسے کہ گلیوں کی صفائی، پانی کی فراہمی، سیوریج، پارکوں کی دیکھ بھال، اور کھیل کے میدانوں کا انتظام وغیرہ)',
  },
  {
    en: 'Participate in the restoration of public schools and the education sector.',
    ur: 'سرکاری اسکولوں اور تعلیم کے شعبے کی بحالی میں حصہ لیں۔',
  },
  {
    en: "Women's Affairs (Protection of Women's Rights, Access to Education and Healthcare, Safe and Respectful Transportation, and Efforts to End Workplace Harassment)",
    ur: 'خواتین کے امور (خواتین کے حقوق کا تحفظ، تعلیم اور صحت کی سہولیات تک رسائی، محفوظ اور باعزت نقل و حمل، اور کام کی جگہ پر ہراسگی کے خاتمے کی کوششیں)',
  },
  {
    en: 'Providing Support For The Revival Of Government Schools And Libraries',
    ur: 'سرکاری اسکولوں اور لائبریریوں کی بحالی میں مدد فراہم کرنا',
  },
  {
    en: 'Organizing Sports And Recreational Activities For Youth',
    ur: 'نوجوانوں کے لیے کھیلوں اور تفریحی سرگرمیوں کا انعقاد',
  },
  {
    en: "Participating In Alkhidmat's Relief Activities During Natural Disasters",
    ur: 'قدرتی آفات میں الخدمت کی امدادی سرگرمیوں میں شرکت',
  },
  { en: 'Preventing Street Crimes', ur: 'اسٹریٹ کرائم کی روک تھام' },
  { en: 'Raising Awareness Through Social Media', ur: 'و سوشل میڈیا پر آگاہی مہم چلانا' },
];

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  const membershipForm = document.getElementById('community-form');
  membershipForm.addEventListener('submit', handleSubmit);

  const activitiesList = membershipForm.querySelector('.activities-list');
  emptyElement(activitiesList);

  const activities = ACTIVITIES.map((activity, index) => createActivity(activity, index));
  activitiesList.append(...activities);
}

function createActivity(activity, index) {
  const { en, ur } = activity;
  const label = document.createElement('label');
  label.setAttribute('for', `activity-${index}`);
  label.classList.add('activity');

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = `activity-${index}`;
  input.name = `activity-${index}`;
  input.setAttribute('data-activity-id', index);
  label.appendChild(input);

  const activityLabel = document.createElement('div');
  activityLabel.classList.add('activity__label');

  const english = document.createElement('strong');
  english.classList.add('english');
  english.innerText = en;

  const urdu = document.createElement('span');
  urdu.classList.add('urdu');
  urdu.innerText = ur;

  activityLabel.appendChild(english);
  activityLabel.appendChild(urdu);

  label.appendChild(activityLabel);

  return label;
}

async function handleSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const errorElem = document.querySelector('[data-form-error]');
  const formButton = document.querySelector('button[type="submit"]');

  const formData = new FormData(form);

  const formDataObject = Object.fromEntries(formData.entries());

  //? FORM DATA OBJECT WILL BE EMPTY IF USER DOES NOT CHECK ANY OF THE ACTIVITIES
  if (Object.keys(formDataObject).length === 0) {
    const errorMessage = 'Please select at least one activity';
    errorElem.innerText = errorMessage;
    errorElem.hidden = false;
    return;
  }

  // HIDE ERROR MESSAGE IN CASE IT EXISTS
  errorElem.innerText = '';
  errorElem.hidden = true;

  const indices = Object.keys(formDataObject).map((key) =>
    parseInt(key.replace('activity-', ''))
  );
  const activities = ACTIVITIES.filter((_, index) => indices.includes(index)).map(
    (activity) => activity.en
  );

  const form1Data = localStorage.getItem(LOCAL_STORAGE_KEY);
  const form1DataObject = JSON.parse(form1Data);

  const postBody = {
    name: form1DataObject.name,
    gender: form1DataObject.gender,
    birth_year: form1DataObject['year-of-birth'],
    phone: form1DataObject['whatsapp-number'].replace('+', ''),
    contribution: activities,
    profession: form1DataObject.profession,
    campaign_id: '9cc03fff-8bce-4376-bd07-adfb68c9d96e',
    country: form1DataObject.country,
    city: form1DataObject.city,
  };

  if (form1DataObject.email) {
    postBody.email = form1DataObject.email;
  }

  formButton.innerText = 'Loading...';
  fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postBody),
  })
    .then((response) => response.json())
    .then((data) => {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      const id = data.data.id;
      console.log(id);
      window.location.href = NEXT_PAGE_URL(id);
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('Error submitting form');
      formButton.removeAttribute('disabled');
      formButton.innerText = 'Submit';
    });
}

function emptyElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
