const fs = require("fs");
const path = require("path");
const MainScrapper = require("./MainScrapper");

class Update {
  row;
  pathExcelMassUpdate = path.join(
    process.cwd(),
    "template/mass_update_sales_info_464946005_20230414114201.xlsx"
  );

  constructor() {}

  async run(row = 7) {
    try {
      this.row = row;
      const filename = MainScrapper.getInitialInput("filename");
      MainScrapper.setFilename(
        `[${MainScrapper.getDateNow()}] mass-update-${filename}-result`
      );

      console.log("reading excel");
      const readExcel = await this.readingExcel();

      console.log("fetch data");
      const fetchData = await this.fetchData(readExcel);

      console.log("updatedata");
      const updateData = await this.updateData(fetchData);
    } catch (error) {
      console.log(error);
    }
  }

  async readingExcel() {
    console.log("==== TRY READING EXCEL FILE ====");
    try {
      const { inputExcel, totalRow } = MainScrapper.getInitialInput();
      const template = inputExcel || this.pathExcelMassUpdate;

      return await MainScrapper.workboxReadFile(template).then(() => {
        const rows = MainScrapper.getWorksheet(1).getRows(this.row, totalRow);
        const pathFromTitle = [];

        console.log("Convert title ke slug");
        rows.forEach((row) => {
          const replaceSymbol = MainScrapper.replaceSymbolWithDash(row, 2);

          pathFromTitle.push(replaceSymbol);
        });

        console.log("Start fetching...");
        return MainScrapper.filterSameData(pathFromTitle);
      });
    } catch (error) {
      console.log(error);
    }
  }

  async fetchData(pathFromTitle = []) {
    try {
      const newData = [];
      if (pathFromTitle.length === 0) {
        console.log("Data tidak ditemukan!");
        return;
      }

      let index = 0;

      while (true) {
        const grabData = await MainScrapper.axiosGet(
          `slug/${pathFromTitle[index]}`
        ).then((res) => res.data);

        console.log(
          `Updating data ke-${index + 1} dari ${pathFromTitle.length}`
        );

        if (Object.keys(grabData).length === 0) {
          console.log("stop\n\n");
          break;
        }

        // if (index === 5) break;

        newData.push({
          name: grabData.name,
          variants: grabData.variants
        });
        index += 1;
        await MainScrapper.delay(process.env.SLEEP_TIME);
      }

      return newData;
    } catch (error) {
      console.log(error);
    }
  }

  async updateData(newData) {
    try {
      const pathName = path.join(
        MainScrapper.getFinalDir(),
        MainScrapper.getFilename()
      );

      MainScrapper.checkOrCreatePath(pathName);

      if (newData.length === 0) {
        console.log("Data tidak ditemukan!");
        return;
      }

      fs.writeFileSync(
        path.join(pathName, `${MainScrapper.getFilename()}.json`),
        JSON.stringify(newData, null, 4)
      );
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new Update();