import { Prisma, PrismaClient } from "@prisma/client";
import { parse } from "csv";
import fs from "node:fs";

type Rows = {
  make: string;
  model: string;
  varriant: string | undefined;
  yearStart: number;
  yearEnd: number;
};

const BATCH_SIZE = 100;

export async function seedTaxonomy(prisma: PrismaClient) {
  const rows = await new Promise<Rows[]>((resolve, reject) => {
    const eachRow: any[] = [];

    fs.createReadStream("taxonomy.csv")
      .pipe(parse({ columns: true }))
      .on("data", (row: { [index: string]: string }) => {
        eachRow.push({
          make: row.Make,
          model: row.Model,
          varriant: row.Model_Variant || undefined,
          yearStart: Number(row.Year_Start),
          yearEnd: row.Year_End
            ? Number(row.Year_End)
            : new Date().getFullYear(),
        });
      })
      .on("error", (err) => {
        console.log(err);
        reject(err);
      })
      .on("end", () => {
        resolve(eachRow);
      });
  });
  console.log(rows);

  type MakeModelMap = {
    [make: string]: {
      [model: string]: {
        varriant: {
          [varriant: string]: {
            yearStart: number;
            yearEnd: number;
          };
        };
      };
    };
  };

  const result: MakeModelMap = {};

  for (const row of rows) {
    if (!result[row.make]) {
      result[row.make] = {};
    }
    if (!result[row.make][row.model]) {
      result[row.make][row.model] = {
        varriant: {},
      };
    }
    if (row.varriant) {
      result[row.make][row.model].varriant[row.varriant] = {
        yearStart: row.yearStart,
        yearEnd: row.yearEnd,
      };
    }
  }
  console.log({ result });

  const makePromises = Object.entries(result).map(([name]) => {
    return prisma.make.upsert({
      where: { name },
      update: {
        name,
        image: `https://vl.imgix.net/img/${name
          .replace(/\s+/g, "-")
          .toLowerCase()}-logo.png?auto=format,compress`,
      },
      create: {
        name,
        image: `https://vl.imgix.net/img/${name
          .replace(/\s+/g, "-")
          .toLowerCase()}-logo.png?auto=format,compress`,
      },
    });
  });

  const makes = await Promise.all(makePromises);
  console.log(`seed with ${makes.length} makes🌱`);

  const modelPromises = [];

  for (const make of makes) {
    for (const model in result[make.name]) {
      modelPromises.push(
        prisma.model.upsert({
          where: {
            makeId_name: {
              name: model,
              makeId: make.id,
            },
          },
          update: {
            name: model,
          },
          create: {
            name: model,
            make: { connect: { id: make.id } },
          },
        })
      );
    }
  }

  async function insertInBatches(
    items: Promise<any>[],
    batchSize: number,
    insertFunction: (batch: Promise<any>[]) => Promise<void>
  ) {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await insertFunction(batch);
    }
  }
  await insertInBatches(
    modelPromises,
    BATCH_SIZE,
    async (batch) => {
      const models = await Promise.all(batch);
      console.log(`seed with ${models.length} models🌱`);
    }
  );
  const varriantPromises = [];
  for (const make of makes) {
    const models = await prisma.model.findMany({
      where: { makeId: make.id },
    });
    for (const model of models) {
      for (const [varriant, year_range] of Object.entries(
        result[make.name][model.name].varriant
      )) {
        varriantPromises.push(
          prisma.modelVariant.upsert({
            where: {
              modelId_name: {
                name: varriant,
                modelId: model.id,
              },
            },
            update: {
              name: varriant,
            },
            create: {
              name: varriant,
              yearStart: year_range.yearStart,
              yearEnd: year_range.yearEnd,
              model: { connect: { id: model.id } },
            },
          })
        );
      }
    }
  }
  await insertInBatches(
    varriantPromises,
    BATCH_SIZE,
    async (batch) => {
      const varriants = await Promise.all(batch);
      console.log(`seed with ${varriants.length} varriants🌱`);
    }
  );
}