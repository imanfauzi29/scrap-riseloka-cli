import axios from "axios";
import fs from "fs";

const baseUrl = "https://www.riseloka.com/api/product";

const config = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36"
  }
};

async function run() {
  try {
    console.log("==== GRABBING DATA ====");
    let data = [];
    let page = 1;
    while (true) {
      const urlList = `${baseUrl}?page=${page}&length=50&sort=recommendation&category=737`;

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
    index += 1;
    await delay(3000);
  }

  fs.writeFileSync("./result.json", JSON.stringify(newData));
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

run();
