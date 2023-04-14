const axios = require("axios");
const fs = require("fs");
const Excel = require("exceljs");
const readline = require("readline-sync");
const path = require("path");
const excelTemplate = require("./template/excel_template.json");
const shopeeCategory = require("./template/shopee_category.json");

const workbox = new Excel.Workbook();

const baseUrl = "https://www.riseloka.com/api/product";

const dateNow = new Date().toLocaleDateString("id-ID", { dateStyle: "medium" });
const pathName = path.join(__dirname, "result");
let namaFile = null;

const currentRow = 6;

const config = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36"
  }
};

async function main() {
  const category = readline.question("Masukan no kategory (Jika ada): ");
  const brand = readline.question("Masukan nama brand (Jika ada): ");
  const filename = readline.question("Masukan nama file (required): ");

  if (!filename) {
    console.log("filename required!");
    return;
  } else {
    namaFile = filename.replace(/\s+/, "_");
  }

  const checkFileExist = await checkFile();

  console.log(checkFileExist);

  // if true skip grab data continue to excel
  if (checkFileExist) {
    const jsonFileName = `${namaFile}/(${dateNow})${namaFile}.json`;
    const jsonFile = path.join(pathName, jsonFileName);

    const file = fs.readFileSync(jsonFile);

    toExcel(JSON.parse(file), jsonFileName);
  } else {
    console.log("MASUK SINI DONG");
    run(category, brand);
  }
}

async function checkFile() {
  const isExist = fs.existsSync(path.join(pathName, namaFile));
  if (!isExist) fs.mkdirSync(path.join(pathName, namaFile));

  const jsonFileName = `${namaFile}/(${dateNow})${namaFile}.json`;
  const jsonFile = path.join(pathName, jsonFileName);

  // check for existing file
  if (fs.existsSync(jsonFile)) {
    // ask json file is exists (default No)
    const isFileExistResponse = readline.question(
      `\nfile ${jsonFileName} sudah tersedia di folder ${path.join(
        pathName,
        namaFile
      )}. Refetch ? (y/N): `
    );

    if (!isFileExistResponse.match(/(Y|N|y|n|\s)/)) {
      console.log("Masukan opsi yang benar...");
      return true;
    }

    if (
      isFileExistResponse === "" ||
      isFileExistResponse.toLowerCase() === "n"
    ) {
      return true;
    }
  }
  return false;
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
  let newData = [];
  console.log("==== DOWNLOADING DATA ====");
  const totalData = data.length;
  let index = 0;

  if (totalData === 0) {
    console.log("Data not found! mybe try again with another category...");
    return;
  }

  while (true) {
    const grabData = await axios
      .get(`${baseUrl}/slug/${data[index]}`, config)
      .then((res) => res.data);

    console.log(`Downloading data ke ${index + 1} dari ${totalData + 1}`);

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
  const jsonFileName = `${namaFile}/(${dateNow})${namaFile}.json`;
  const jsonFile = path.join(pathName, jsonFileName);

  fs.writeFileSync(jsonFile, JSON.stringify(newData));

  toExcel(newData, jsonFileName);
}

function toExcel(data = [], jsonFileName) {
  const dataLength = data.length;

  if (dataLength === 0) return;

  let myRow = currentRow;
  // const endRow = dataLength + currentRow;

  try {
    workbox.xlsx
      .readFile("./template/Shopee_mass_upload_11-04-2023_basic_template.xlsx")
      .then(() => {
        const worksheet = workbox.getWorksheet("Template");
        data.forEach((item) => {
          item.variants.forEach((variant) => {
            if (item.description.length < 20 || item.imgs === null) return;
            const row = worksheet.getRow(myRow);
            row.getCell(excelTemplate.kategory).value =
              shopeeCategory[item.category] ?? null;
            row.getCell(excelTemplate.product_name).value = item.name;
            row.getCell(excelTemplate.description).value =
              item.description.substring(0, 3000);
            row.getCell(excelTemplate.sku).value = item.sku;
            row.getCell(excelTemplate.kode_integrasi).value = item.id;
            row.getCell(excelTemplate.nama_variasi_1).value = item.variant_1;
            row.getCell(excelTemplate.varian_variasi_1).value =
              variant.variant_1;
            row.getCell(excelTemplate.foto_variant).value =
              item.imgs.length > 0 ? item.imgs[0] : null;
            row.getCell(excelTemplate.nama_variasi_2).value = item.variant_2;
            row.getCell(excelTemplate.varian_variasi_2).value =
              variant.variant_2;
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
              row.getCell(excelTemplate[`foto_product_${index}`]).value =
                result;
            }
            myRow += 1;
          });
        });
        workbox.xlsx.writeFile(
          path.join(pathName, jsonFileName.replace(".json", ".xlsx"))
        );

        console.log(
          `File success created: ${jsonFileName.replace(".json", ".xlsx")}`
        );
      });
  } catch (error) {
    console.log(error);
  }
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

main();
