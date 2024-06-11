const saveButton = document.getElementById('saveButton');
let isSaved = false;

// Cek status produk saat halaman dimuat
window.addEventListener('DOMContentLoaded', async () => {
  const productId = saveButton.getAttribute('data-productid');

  try {
    const response = await fetch('/checkSavedStatus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId })
    });

    if (response.ok) {
      const data = await response.json();
      isSaved = data.saved;

      updateSaveButtonStyle(); // Perbarui gaya tombol berdasarkan status penyimpanan
    }
  } catch (error) {
    console.error(error);
  }
});

saveButton.addEventListener('click', async () => {
  const productId = saveButton.getAttribute('data-productid');

  try {
    const response = await fetch('/toggleSave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId })
    });

    if (response.ok) {
      const data = await response.json();
      isSaved = data.saved;

      updateSaveButtonStyle(); // Perbarui gaya tombol berdasarkan status penyimpanan

      if (isSaved) {
        // Barang berhasil disimpan
        alert('Produk berhasil disimpan!');
      } else {
        // Barang berhasil dihapus
        alert('Produk berhasil dihapus dari laman saved!');
      }
    }
  } catch (error) {
    console.error(error);
  }
});

function updateSaveButtonStyle() {
  if (isSaved) {
    // Barang disimpan
    saveButton.classList.add('saved');
  } else {
    // Barang tidak disimpan
    saveButton.classList.remove('saved');
  }
}
