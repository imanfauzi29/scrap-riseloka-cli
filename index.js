const axios = require("axios");
const fs = require("fs");
const Excel = require("exceljs");
const readline = require("readline-sync");
const path = require("path");

const workbox = new Excel.Workbook();

const baseUrl = "https://www.riseloka.com/api/product";

const excelTemplate = {
  kategory: 1,
  product_name: 2,
  description: 3,
  sku: 4,
  produk_berbahaya: 5,
  kode_integrasi: 6,
  nama_variasi_1: 7,
  varian_variasi_1: 8,
  foto_variant: 9,
  nama_variasi_2: 10,
  varian_variasi_2: 11,
  harga: 12,
  stock: 13,
  kode_variasi: 14,
  foto_sampul: 16,
  foto_product_1: 17,
  foto_product_2: 18,
  foto_product_3: 19,
  foto_product_4: 20,
  foto_product_5: 21,
  foto_product_6: 22,
  foto_product_7: 23,
  foto_product_8: 24,
  weight: 25,
  cashless: 29
};

const pathName = path.join(__dirname, "result");
let namaFile = null;

const currentRow = 6;

const config = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36"
  }
};

function main() {
  const category = readline.question("Masukan no kategory (Jika ada): ");
  const brand = readline.question("Masukan nama brand (Jika ada): ");
  const filename = readline.question("Masukan nama file (required): ");

  if (!filename) {
    console.log("filename required!");
    return;
  } else {
    namaFile = filename.replace(/\s+/, "_") + ".json";
  }

  run(category, brand);
}

async function run(category, brand) {
  try {
    console.log("==== GRABBING DATA ====");
    let data = [];
    let page = 1;
    while (true) {
      const urlList = `${baseUrl}?page=${page}&length=50&sort=recommendation&category=${category}&brand=${brand}`;

      const result = await axios.get(urlList, config).then((res) => res.data);

      if (result.data.data.length === 0) {
        console.log("stop");
        break;
      }

      const filterId = result.data.data.map((v) => v.slug);

      console.log(`Grabbing slug data page=${page}`);

      data = [...data, ...filterId];
      page += 1;
      await delay(3000);
    }

    await grabData(data);
  } catch (error) {
    console.log(error);
  }
}

async function grabData(data = []) {
  console.log("==== DOWNLOADING DATA ====");
  const totalData = data.length;
  let index = 0;

  const newData = [];

  if (totalData === 0) {
    console.log("Data not found! mybe try again with another category...");
    return;
  }

  while (true) {
    const grabData = await axios
      .get(`${baseUrl}/slug/${data[index]}`, config)
      .then((res) => res.data);

    console.log(`Downloading data ${index + 1} dari ${totalData}`);

    if (Object.keys(grabData.data).length === 0) {
      console.log("stop");
      break;
    }

    newData.push(grabData.data);
    // newData.push(grabData.data.category);
    index += 1;
    await delay(2000);
  }

  // const filterData = newData.filter((v, x) => newData.indexOf(v) === x);
  fs.writeFileSync(path.join(pathName, namaFile), JSON.stringify(newData));
  toExcel(newData);
}

function toExcel(data = []) {
  data = fs.readFileSync(path.join(pathName, namaFile));
  data = JSON.parse(data);
  const getShopeeCategory = path.join(
    __dirname,
    "template/shopee_category.json"
  );
  const dataLength = data.length;

  if (dataLength === 0) return;

  let myRow = currentRow;
  // const endRow = dataLength + currentRow;

  workbox.xlsx
    .readFile("./template/Shopee_mass_upload_11-04-2023_basic_template.xlsx")
    .then(() => {
      const worksheet = workbox.getWorksheet("Template");
      data.forEach((item) => {
        item.variants.forEach((variant) => {
          if (item.description.length < 20) return;
          const row = worksheet.getRow(myRow);
          row.getCell(excelTemplate.kategory).value =
            getShopeeCategory[item.category] ?? null;
          row.getCell(excelTemplate.product_name).value = item.name;
          row.getCell(excelTemplate.description).value =
            item.description.substring(0, 3000);
          row.getCell(excelTemplate.sku).value = item.sku;
          row.getCell(excelTemplate.kode_integrasi).value = item.id;
          row.getCell(excelTemplate.nama_variasi_1).value = item.variant_1;
          row.getCell(excelTemplate.varian_variasi_1).value = variant.variant_1;
          row.getCell(excelTemplate.foto_variant).value =
            item.imgs.length > 0 ? item.imgs[0] : null;
          row.getCell(excelTemplate.nama_variasi_2).value = item.variant_2;
          row.getCell(excelTemplate.varian_variasi_2).value = variant.variant_2;
          row.getCell(excelTemplate.harga).value = variant.selling_price;
          row.getCell(excelTemplate.stock).value = variant.stock;
          row.getCell(excelTemplate.kode_variasi).value = variant.variant_id;
          row.getCell(excelTemplate.foto_sampul).value =
            item.imgs.length > 0 ? item.imgs[0] : null;
          row.getCell(excelTemplate.cashless).value = "Aktif";
          row.getCell(excelTemplate.weight).value = variant.weight;
          for (const i in [...Array(8).keys()]) {
            const index = Number(i) + 1;
            const result = item.imgs[i] ?? null;
            row.getCell(excelTemplate[`foto_product_${index}`]).value = result;
          }
          myRow += 1;
        });
      });
      workbox.xlsx.writeFile(
        path.join(pathName, namaFile.replace(".json", ".xlsx"))
      );
    });
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

main();
