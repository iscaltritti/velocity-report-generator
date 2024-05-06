import fs from "fs";
import csv from "csv-parser";

export const readCsv = async (path, rowCallback) => {
  const data = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(csv())
      .on("data", (row) => {
        data.push(rowCallback(row));
      })
      .on("end", () => {
        resolve(data);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};
