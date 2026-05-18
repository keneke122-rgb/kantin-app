
const API_URL =
  "https://script.google.com/macros/s/AKfycbypOUrgKJo2r9ErW3RGJV4irDNpTCHmbQK9VsgEuu30C3274hFvUYKs397IW8zkH2bWeQ/exec";


const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

function swalWarning(title, text) {
  return Swal.fire({
    icon: "warning",
    title: title,
    text: text || "",
    confirmButtonText: "Oke",
    confirmButtonColor: "#ffd600",
  });
}

function escapeHTML(str) {
  if (!str) return "";
  return str
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJS(str) {
  if (!str) return "";
  return str.toString().replace(/'/g, "\\'");
}

function fetchJsonp(url, params) {
  return new Promise(function (resolve, reject) {
    var cbName =
      "__jsonpCb_" + Date.now() + "_" + Math.random().toString(36).slice(2);

    var timer = setTimeout(function () {
      cleanup();
      reject(
        new Error("JSONP timeout (10s) — cek koneksi atau URL Apps Script"),
      );
    }, 10000);

    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      var el = document.getElementById(cbName);
      if (el) el.parentNode.removeChild(el);
    }

    window[cbName] = function (data) {
      cleanup();
      resolve(data);
    };

    var queryParts = ["callback=" + cbName, "t=" + Date.now()];
    if (params) {
      Object.keys(params).forEach(function (k) {
        queryParts.push(k + "=" + encodeURIComponent(params[k]));
      });
    }

    var script = document.createElement("script");
    script.id = cbName;
    script.src = url + "?" + queryParts.join("&");
    script.onerror = function () {
      cleanup();
      reject(
        new Error(
          'Script load error — pastikan URL Apps Script benar dan sudah deploy "Anyone"',
        ),
      );
    };
    document.head.appendChild(script);
  });
}


var cart = [];

function loadCart() {
  var savedCart = localStorage.getItem("kantinCart");
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      cart = [];
    }
  }
  renderCart();
}

function saveCart() {
  localStorage.setItem("kantinCart", JSON.stringify(cart));
  renderCart();
}

window.tambahKeKeranjang = function (menu, harga) {
  var existingItem = cart.find(function (item) {
    return item.menu === menu;
  });
  if (existingItem) {
    existingItem.jumlah += 1;
  } else {
    cart.push({ menu: menu, harga: harga, jumlah: 1 });
  }
  saveCart();

  Toast.fire({
    icon: "success",
    title:
      "\uD83D\uDED2 <strong>" + escapeHTML(menu) + "</strong> ditambahkan!",
  });

  var menuEscaped = menu.replace(/'/g, "\\'");
  var btns = document.querySelectorAll(
    'button[onclick*="' + menuEscaped + '"]',
  );
  btns.forEach(function (btn) {
    var originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Ditambahkan!';
    setTimeout(function () {
      btn.innerHTML = originalText;
    }, 1000);
  });

  document.getElementById("keranjang").scrollIntoView({ behavior: "smooth" });
};

window.updateJumlahItem = function (index, change) {
  var item = cart[index];
  var newJumlah = item.jumlah + change;
  if (newJumlah <= 0) {
    cart.splice(index, 1);
    Toast.fire({ icon: "info", title: "Item dihapus dari keranjang" });
  } else {
    item.jumlah = newJumlah;
  }
  saveCart();
};

window.hapusItem = function (index) {
  var namaItem = cart[index] ? cart[index].menu : "Item";
  cart.splice(index, 1);
  saveCart();
  Toast.fire({
    icon: "info",
    title: "\uD83D\uDDD1\uFE0F " + escapeHTML(namaItem) + " dihapus",
  });
};

function renderCart() {
  var cartContainer = document.getElementById("cart-items");
  var totalSpan = document.getElementById("cart-total");
  var cartCount = document.getElementById("cart-count");

  if (!cartContainer) return;

  if (cart.length === 0) {
    cartContainer.innerHTML =
      '<div class="text-center text-gray-400 py-8 text-sm">Keranjang masih kosong, pilih menu dulu bro!</div>';
    if (totalSpan) totalSpan.innerText = "Rp 0";
    if (cartCount) cartCount.innerText = "0";
    return;
  }

  var total = 0,
    totalItems = 0,
    html = "";

  cart.forEach(function (item, index) {
    var subtotal = item.harga * item.jumlah;
    total += subtotal;
    totalItems += item.jumlah;

    html +=
      '<div class="flex items-center justify-between border-b border-gray-100 py-3">' +
      '<div class="flex-1">' +
      '<h4 class="font-semibold text-unnesBlue text-sm">' +
      escapeHTML(item.menu) +
      "</h4>" +
      '<p class="text-xs text-gray-500">Rp ' +
      item.harga.toLocaleString("id-ID") +
      "</p>" +
      "</div>" +
      '<div class="flex items-center gap-2">' +
      '<button onclick="updateJumlahItem(' +
      index +
      ', -1)" class="w-8 h-8 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition"><i class="fas fa-minus text-xs"></i></button>' +
      '<span class="w-8 text-center font-semibold text-sm">' +
      item.jumlah +
      "</span>" +
      '<button onclick="updateJumlahItem(' +
      index +
      ', 1)" class="w-8 h-8 rounded-full bg-green-100 text-green-500 hover:bg-green-200 transition"><i class="fas fa-plus text-xs"></i></button>' +
      '<button onclick="hapusItem(' +
      index +
      ')" class="ml-2 text-red-400 hover:text-red-600"><i class="fas fa-trash-alt"></i></button>' +
      "</div>" +
      '<div class="ml-4 text-right min-w-[80px]">' +
      '<span class="font-semibold text-orange-500 text-sm">Rp ' +
      subtotal.toLocaleString("id-ID") +
      "</span>" +
      "</div></div>";
  });

  cartContainer.innerHTML = html;
  if (totalSpan) totalSpan.innerText = "Rp " + total.toLocaleString("id-ID");
  if (cartCount) cartCount.innerText = totalItems;
}


async function checkout() {
  if (cart.length === 0) {
    await swalWarning(
      "Keranjang Kosong!",
      "Silakan pilih menu terlebih dahulu sebelum checkout.",
    );
    return;
  }

  var nama = document.getElementById("checkout-nama").value.trim();
  if (!nama) {
    await swalWarning(
      "Nama Belum Diisi!",
      "Silakan isi nama pemesan terlebih dahulu.",
    );
    document.getElementById("checkout-nama").focus();
    return;
  }

  var checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML =
      '<i class="fa-solid fa-circle-notch fa-spin"></i> Memproses...';
  }

  Swal.fire({
    title: "Memproses Pesanan...",
    html: "Mohon tunggu, pesananmu sedang dicatat ke database \uD83D\uDCCB",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: function () {
      Swal.showLoading();
    },
  });

  try {
    var total = 0,
      detailPesanan = "",
      allOrders = [];
    var catatan =
      document.getElementById("checkout-catatan").value.trim() || "Tidak ada";

    cart.forEach(function (item, index) {
      var subtotal = item.harga * item.jumlah;
      total += subtotal;
      detailPesanan +=
        index +
        1 +
        ". " +
        item.menu +
        " x" +
        item.jumlah +
        " = Rp " +
        subtotal.toLocaleString("id-ID") +
        "\n";
      allOrders.push({
        nama: nama,
        menu: item.menu,
        jumlah: item.jumlah,
        total: subtotal,
        catatan: catatan,
      });
    });


    for (var i = 0; i < allOrders.length; i++) {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allOrders[i]),
      });
    }

    await new Promise(function (resolve) {
      setTimeout(resolve, 1500);
    });
    await muatRiwayatTransaksi();

    Swal.close();

    var waMsg = 'Halo Admin Kantin FEB! 🍽️✨\n\n' +
            '*PESANAN BARU*\n' +
            '👤 *Nama:* ' + nama + '\n\n' +
            '*Detail Pesanan:*\n' + detailPesanan + '\n' +
            '━━━━━━━━━━━━━━━━\n' +
            '💰 *TOTAL: Rp ' + total.toLocaleString("id-ID") + '*\n\n' +
            '📝 *Catatan:* ' + catatan + '\n\n' +
            'Mohon segera diproses ya, terima kasih! 🙏';
            
var waUrl = "https://api.whatsapp.com/send?phone=62882005293513&text=" + encodeURIComponent(waMsg);

    cart = [];
    saveCart();
    document.getElementById("checkout-nama").value = "";
    document.getElementById("checkout-catatan").value = "";

    await Swal.fire({
      icon: "success",
      title: "\uD83C\uDF89 Pesanan Berhasil Dicatat!",
      html:
        '<div style="text-align:center;">' +
        '<p style="color:#4b5563;margin-bottom:8px;">Total pembayaran kamu:</p>' +
        '<p style="font-size:1.5rem;font-weight:800;color:#f97316;">Rp ' +
        total.toLocaleString("id-ID") +
        "</p>" +
        '<p style="color:#6b7280;font-size:0.85rem;margin-top:10px;">Klik tombol di bawah untuk konfirmasi ke WhatsApp Admin \uD83D\uDCF2</p>' +
        "</div>",
      confirmButtonText:
        '<i class="fab fa-whatsapp"></i> Buka WhatsApp Sekarang',
      confirmButtonColor: "#25D366",
      showCancelButton: false,
      allowOutsideClick: false,
    });

    window.open(waUrl, "_blank");
  } catch (error) {
    console.error("Checkout error:", error);
    Swal.close();

    var total2 = 0,
      detailPesanan2 = "";
    cart.forEach(function (item, index) {
      var subtotal = item.harga * item.jumlah;
      total2 += subtotal;
      detailPesanan2 +=
        index +
        1 +
        ". " +
        item.menu +
        " x" +
        item.jumlah +
        " = Rp " +
        subtotal.toLocaleString("id-ID") +
        "\n";
    });

    var waMsg2 = 'Halo Admin Kantin FEB! \uD83C\uDF7D\uFE0F\u2728\n\n' +
             '*PESANAN BARU*\n' +
             '\uD83D\uDC64 *Nama:* ' + (nama || '-') + '\n\n' +
             '*Detail Pesanan:*\n' + detailPesanan2 + '\n' +
             '━━━━━━━━━━━━━━━━\n' +
             '\uD83D\uDCB0 *TOTAL: Rp ' + total2.toLocaleString('id-ID') + '*\n\n' +
             'Mohon segera diproses ya, terima kasih! \uD83D\uDE4F';

    var result2 = await Swal.fire({
      icon: "warning",
      title: "\u26A0\uFE0F Kendala Koneksi",
      html: '<p style="color:#4b5563;">Terjadi kendala saat menyimpan ke database, tapi pesananmu tetap bisa dikirim langsung via WhatsApp.</p>',
      confirmButtonText: '<i class="fab fa-whatsapp"></i> Tetap Kirim via WA',
      confirmButtonColor: "#25D366",
      showCancelButton: true,
      cancelButtonText: "Batal",
    });

    if (result2.isConfirmed) {
      window.open(
        "https://wa.me/+62882005293513?text=" + encodeURIComponent(waMsg2),
        "_blank",
      );
    }
  } finally {
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML =
        '<i class="fab fa-whatsapp text-xl"></i> Checkout via WhatsApp';
    }
  }
}

async function muatMenuDariSpreadsheet() {
  var menuContainer = document.getElementById("menu-container");
  if (!menuContainer) return;

  menuContainer.innerHTML =
    '<div class="col-span-full text-center py-10 text-slate-500 font-medium"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat menu lezat Kantin FEB...</div>';

  try {
    var result = await fetchJsonp(API_URL);

    if (result.status === "success") {
      var listProduk = result.data;
      menuContainer.innerHTML = "";

      if (listProduk.length === 0) {
        menuContainer.innerHTML =
          '<div class="col-span-full text-center py-10 text-slate-400">Belum ada menu di database admin.</div>';
        return;
      }

      listProduk.forEach(function (produk) {
        var statusTersedia = produk.status === "tersedia";

        var statusBadge = statusTersedia
          ? '<span class="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">Tersedia</span>'
          : '<span class="absolute top-4 right-4 bg-rose-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">Habis</span>';

        var tombolPilih = statusTersedia
          ? "<button onclick=\"tambahKeKeranjang('" +
            escapeJS(produk.nama) +
            "', " +
            produk.harga +
            ')" class="bg-unnesBlue hover:bg-blue-800 text-white font-medium text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-sm"><i class="fa-solid fa-cart-plus text-xs"></i> Tambah ke Keranjang</button>'
          : '<button disabled class="bg-slate-300 text-slate-500 font-medium text-sm px-4 py-2 rounded-xl cursor-not-allowed flex items-center gap-2 shadow-sm">Habis</button>';

        var card = document.createElement("div");
        card.className =
          "bg-white rounded-3xl shadow-md hover:shadow-2xl overflow-hidden transition duration-300 transform hover:-translate-y-2 border border-slate-100 flex flex-col justify-between menu-card";
        card.innerHTML =
          '<div class="relative group overflow-hidden">' +
          '<img src="' +
          (produk.gambar ||
            "https://via.placeholder.com/300x200?text=Menu+Kantin") +
          '" alt="' +
          escapeHTML(produk.nama) +
          '" class="w-full h-48 object-cover group-hover:scale-110 transition duration-500" onerror="this.src=\'https://via.placeholder.com/300x200?text=Menu+Kantin\'">' +
          statusBadge +
          "</div>" +
          '<div class="p-6 flex flex-col flex-grow">' +
          '<h3 class="text-lg font-bold text-slate-800 mb-1">' +
          escapeHTML(produk.nama) +
          "</h3>" +
          '<p class="text-xs text-slate-400 mb-4 flex-grow">' +
          escapeHTML(produk.deskripsi || "") +
          "</p>" +
          '<div class="flex items-center justify-between mt-auto pt-2">' +
          '<span class="text-lg font-extrabold text-orange-500">Rp ' +
          parseInt(produk.harga).toLocaleString("id-ID") +
          "</span>" +
          tombolPilih +
          "</div>" +
          "</div>";
        menuContainer.appendChild(card);
      });
    } else {
      menuContainer.innerHTML =
        '<div class="col-span-full text-center py-10 text-red-500">\u26A0\uFE0F Gagal memuat menu: ' +
        escapeHTML(result.message || "unknown error") +
        "</div>";
    }
  } catch (error) {
    console.error("Gagal memuat menu:", error);
    menuContainer.innerHTML =
      '<div class="col-span-full text-center py-10 text-rose-500 font-medium">' +
      '<i class="fas fa-circle-exclamation mr-2"></i>\u26A0\uFE0F Gagal memuat menu dari cloud server.<br>' +
      '<span class="text-xs text-slate-400 mt-2 block">' +
      escapeHTML(error.message) +
      "</span>" +
      "</div>";
  }
}


var semuaDataTransaksi = [];
var currentPage = 1;
var rowsPerPage = 5;

async function muatRiwayatTransaksi() {
  var tbody = document.getElementById("riwayat-table-body");
  var emptyMessage = document.getElementById("riwayat-empty");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="5" class="text-center py-8 text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat riwayat transaksi...</td></tr>';

  try {
    var result = await fetchJsonp(API_URL, { action: "get_transactions" });

    if (result.status === "success" && result.data && result.data.length > 0) {
      if (emptyMessage) emptyMessage.classList.add("hidden");
      semuaDataTransaksi = result.data;
      currentPage = 1;
      tampilkanHalaman(1);
      tambahkanPagination(semuaDataTransaksi.length);
    } else {
      tbody.innerHTML = "";
      if (emptyMessage) emptyMessage.classList.remove("hidden");
      hapusPagination();
    }
  } catch (error) {
    console.error("Gagal memuat riwayat:", error);
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center py-8 text-rose-500"><i class="fa-solid fa-circle-exclamation mr-2"></i>Gagal memuat riwayat: ' +
      escapeHTML(error.message) +
      "</td></tr>";
    hapusPagination();
  }
}

function tampilkanHalaman(page) {
  var tbody = document.getElementById("riwayat-table-body");
  if (!tbody) return;

  var startIndex = (page - 1) * rowsPerPage;
  var dataHalaman = semuaDataTransaksi.slice(
    startIndex,
    startIndex + rowsPerPage,
  );
  tbody.innerHTML = "";

  dataHalaman.forEach(function (trans) {
    var row = document.createElement("tr");
    row.className = "border-b border-gray-100 hover:bg-blue-50/30 transition";

    var tanggal =
      trans.timestamp ||
      trans.Timestamp ||
      trans.tanggal ||
      trans.Tanggal ||
      "-";
    if (
      typeof tanggal === "string" &&
      (tanggal.indexOf("T") !== -1 || tanggal.indexOf("Z") !== -1)
    ) {
      try {
        tanggal = new Date(tanggal).toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta",
        });
      } catch (e) {
        /* biarkan raw */
      }
    }

    var nama = trans.nama || trans.Nama || "-";
    var menu = trans.menu || trans.Menu || "-";
    var jumlah = trans.jumlah || trans.Jumlah || 0;
    var total = trans.total || trans.Total || 0;

    row.innerHTML =
      '<td class="hidden md:table-cell py-3 px-3 text-sm text-gray-600">' +
      escapeHTML(String(tanggal)) +
      "</td>" +
      '<td class="py-3 px-3 font-medium text-gray-800">' +
      escapeHTML(nama) +
      "</td>" +
      '<td class="py-3 px-3 text-gray-700">' +
      escapeHTML(menu) +
      "</td>" +
      '<td class="py-3 px-3 text-center font-semibold">' +
      jumlah +
      "</td>" +
      '<td class="py-3 px-3 text-right font-bold text-unnesBlue">Rp ' +
      parseInt(total).toLocaleString("id-ID") +
      "</td>";
    tbody.appendChild(row);
  });
}

function tambahkanPagination(totalData) {
  var totalPages = Math.ceil(totalData / rowsPerPage);
  var containerRiwayat = document.querySelector("#riwayat .bg-white");
  hapusPagination();
  if (totalPages <= 1) return;

  var paginationDiv = document.createElement("div");
  paginationDiv.id = "pagination-controls";
  paginationDiv.className =
    "flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200 flex-wrap";

  function btnCls(disabled) {
    return disabled
      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
      : "bg-unnesBlue text-white hover:bg-unnesDark";
  }

  var html =
    '<button onclick="goToPage(1)" ' +
    (currentPage === 1 ? "disabled" : "") +
    ' class="px-3 py-2 rounded-lg ' +
    btnCls(currentPage === 1) +
    ' transition"><i class="fas fa-angle-double-left"></i></button>' +
    '<button onclick="goToPage(' +
    (currentPage - 1) +
    ')" ' +
    (currentPage === 1 ? "disabled" : "") +
    ' class="px-3 py-2 rounded-lg ' +
    btnCls(currentPage === 1) +
    ' transition"><i class="fas fa-angle-left"></i></button>';

  var startPage = Math.max(1, currentPage - 2);
  var endPage = Math.min(totalPages, currentPage + 2);
  if (endPage - startPage < 4) {
    if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
    else if (endPage === totalPages) startPage = Math.max(1, endPage - 4);
  }

  for (var i = startPage; i <= endPage; i++) {
    html +=
      '<button onclick="goToPage(' +
      i +
      ')" class="px-4 py-2 rounded-lg ' +
      (currentPage === i
        ? "bg-unnesGold text-unnesBlue font-bold"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200") +
      ' transition">' +
      i +
      "</button>";
  }

  html +=
    '<button onclick="goToPage(' +
    (currentPage + 1) +
    ')" ' +
    (currentPage === totalPages ? "disabled" : "") +
    ' class="px-3 py-2 rounded-lg ' +
    btnCls(currentPage === totalPages) +
    ' transition"><i class="fas fa-angle-right"></i></button>' +
    '<button onclick="goToPage(' +
    totalPages +
    ')" ' +
    (currentPage === totalPages ? "disabled" : "") +
    ' class="px-3 py-2 rounded-lg ' +
    btnCls(currentPage === totalPages) +
    ' transition"><i class="fas fa-angle-double-right"></i></button>';

  paginationDiv.innerHTML = html;
  containerRiwayat.appendChild(paginationDiv);

  var infoDiv = document.createElement("div");
  infoDiv.id = "pagination-info";
  infoDiv.className = "text-center text-xs text-gray-500 mt-3";
  infoDiv.innerHTML =
    "Menampilkan " +
    ((currentPage - 1) * rowsPerPage + 1) +
    " - " +
    Math.min(currentPage * rowsPerPage, totalData) +
    " dari " +
    totalData +
    " transaksi";
  containerRiwayat.appendChild(infoDiv);
}

function hapusPagination() {
  var p = document.getElementById("pagination-controls");
  var i = document.getElementById("pagination-info");
  if (p) p.parentNode.removeChild(p);
  if (i) i.parentNode.removeChild(i);
}

window.goToPage = function (page) {
  var totalPages = Math.ceil(semuaDataTransaksi.length / rowsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  tampilkanHalaman(currentPage);
  tambahkanPagination(semuaDataTransaksi.length);
  document.getElementById("riwayat").scrollIntoView({ behavior: "smooth" });
};


var saranForm = document.getElementById("saran-form");
if (saranForm) {
  saranForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var nm = document.getElementById("saran-nama").value.trim();
    var psn = document.getElementById("saran-pesan").value.trim();

    if (!nm || !psn) {
      await swalWarning(
        "Form Belum Lengkap!",
        "Isi nama & saran terlebih dahulu ya!",
      );
      return;
    }

    var waSaran =
      "Halo Admin, Saya " + nm + ' memberikan saran:\n\n"' + psn + '"';
    window.open(
      "https://wa.me/+62882005293513?text=" + encodeURIComponent(waSaran),
      "_blank",
    );
    saranForm.reset();
    Toast.fire({
      icon: "success",
      title: "\u2705 Saran terkirim! Terima kasih.",
    });
  });
}


var observer = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) e.target.classList.add("active");
    });
  },
  { threshold: 0.05 },
);
document.querySelectorAll(".reveal").forEach(function (el) {
  observer.observe(el);
});


var menuBtn = document.getElementById("menu-btn");
var mobileMenu = document.getElementById("mobile-menu");
if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", function () {
    mobileMenu.classList.toggle("hidden");
  });
}


var checkoutBtn = document.getElementById("checkout-btn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", checkout);
}

window.addEventListener("DOMContentLoaded", function () {
  muatMenuDariSpreadsheet();
  muatRiwayatTransaksi();
  loadCart();
});

// Auto refresh riwayat setiap 30 detik jika section terlihat
setInterval(function () {
  var riwayatSection = document.getElementById("riwayat");
  if (
    riwayatSection &&
    riwayatSection.getBoundingClientRect().top < window.innerHeight
  ) {
    muatRiwayatTransaksi();
  }
}, 30000);
