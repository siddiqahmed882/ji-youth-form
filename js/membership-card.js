const API_URL = (id) => `https://reports.karachijamaat.pk/api/v1/membership/${id}`;

const downloadBtn = document.querySelector('[data-download-btn]');
const imageUploadBtn = document.querySelector('[data-image-upload-btn]');
const photoUploadInput = document.getElementById('photo-upload');

document.addEventListener('DOMContentLoaded', addDataToCard);
downloadBtn.addEventListener('click', downloadCard);
imageUploadBtn.addEventListener('click', triggerUpload);
photoUploadInput.addEventListener('change', previewPhoto);

async function addDataToCard() {
  const membershipCard = document.getElementById('card');

  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const id = params.get('id');

  const nameElem = membershipCard.querySelector('.name');
  const addressElem = membershipCard.querySelector('.address');
  const idElem = membershipCard.querySelector('.id');

  if (!id) {
    nameElem.innerText = 'No Name in URL';
    addressElem.innerText = 'No Address in URL';
    idElem.innerText = 'No ID in URL';
    downloadBtn.innerText = 'Invalid URL';

    imageUploadBtn.innerText = 'Invalid URL';

    imageUploadBtn.setAttribute('disabled', 'true');
    downloadBtn.setAttribute('disabled', 'true');

    return;
  }

  const membershipData = await fetchApiData(API_URL(id));
  nameElem.innerText = membershipData.name;
  addressElem.innerText = `${membershipData.city}, ${membershipData.country}`;
  idElem.innerText = `${membershipData.id}`;
}

function triggerUpload() {
  document.getElementById('photo-upload').click();
}

function previewPhoto(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const imageSrc = e.target.result;

      const uploadPhotoSection = document.querySelector('.upload-section');

      while (uploadPhotoSection.firstChild) {
        uploadPhotoSection.removeChild(uploadPhotoSection.firstChild);
      }

      const photoUpload = document.createElement('img');
      photoUpload.src = imageSrc;
      photoUpload.className = 'member-photo';
      photoUpload.alt = 'Member Photo';
      uploadPhotoSection.appendChild(photoUpload);
    };
    reader.readAsDataURL(file);
  }
}

function downloadCard() {
  const card = document.getElementById('card');
  const memberPhoto = document.querySelector('.member-photo');

  // IF NO MEMBER PHOTO EXISTS, SHOW DEFAULT MEMBER PHOTO
  let uploadPhotoSectionClone = null;
  if (!memberPhoto) {
    const uploadPhotoSection = card.querySelector('.upload-section');
    uploadPhotoSectionClone = uploadPhotoSection.cloneNode(true);

    while (uploadPhotoSection.firstChild) {
      uploadPhotoSection.removeChild(uploadPhotoSection.firstChild);
    }

    const photoUpload = document.createElement('img');
    photoUpload.src = '../assets/svg/default-member.svg';
    photoUpload.className = 'member-photo';
    photoUpload.alt = 'Member Photo';
    photoUpload.setAttribute('data-default-member-photo', 'true');
    uploadPhotoSection.appendChild(photoUpload);
  }

  // DOWNLOAD MEMBERSHIP CARD AS PNG
  downloadBtn.innerText = 'Downloading...';
  downloadBtn.setAttribute('disabled', 'true');
  html2canvas(card)
    .then((canvas) => {
      const link = document.createElement('a');
      link.download = 'membership-card.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      link.remove();
    })
    .finally(() => {
      downloadBtn.removeAttribute('disabled');
      downloadBtn.innerText = 'Download as PNG';
    });

  if (uploadPhotoSectionClone) {
    document.querySelector('[data-default-member-photo]').remove();
    const uploadPhotoSection = card.querySelector('.upload-section');
    uploadPhotoSection.appendChild(uploadPhotoSectionClone);
    document
      .querySelector('[data-image-upload-btn]')
      .addEventListener('click', triggerUpload);
  }
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
