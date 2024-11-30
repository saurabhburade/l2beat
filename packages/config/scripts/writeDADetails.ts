import fs from "fs";
import path from "path";
import simpleGit from "simple-git";
import { ScalingProjectTechnologyChoice, layer2s,daLayers } from "../src";

// Initialize simple-git
const git = simpleGit();

// Function to get the last modified date of a file in a Git repository
async function getLastCommit(filePath: string) {
  try {
    const log = await git.log({ file: filePath, n: 1 });

    const lastCommit = log.latest;

    if (lastCommit) {
      console.log(`Last modified date of ${filePath}: ${lastCommit.date}`);
      return lastCommit;
    } else {
      console.log(`No commits found for ${filePath}`);
      return null;
    }
  } catch (error) {
    console.log(`Error fetching git log: ${error}`);
    return null;
  }
}

const saveL2DataToFile = async (filePath: string, data: string) => {
  try {
    // Extract the directory path from the file path
    const dir = path.dirname(filePath);

    // Create the directory if it doesn't exist
    await fs.promises.mkdir(dir, { recursive: true });

    // Write data to the file
    await fs.promises.writeFile(filePath, data);
    console.log(`File saved successfully at ${filePath}`);
  } catch (error) {
    console.error(`🚀 Error saving file:`, error);
  }
};

function has24HoursPassed(timestamp: Date) {
  const currentTime = new Date().getTime();
  const pastTime = new Date(timestamp).getTime();

  // Calculate the difference in milliseconds
  const timeDifference = currentTime - pastTime;

  // Convert 24 hours to milliseconds (24 * 60 * 60 * 1000)
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

  return timeDifference >= twentyFourHoursInMs;
}
const main = async () => {
  const array = layer2s;
  for (let index = 0; index < array.length; index++) {
    const daLayer = array[index];
    let chainDataExist;
    try {
      chainDataExist = fs.statSync(
        path.join(__dirname, `../data/projects/layer2s/${da.id}.json`)
      );
    } catch (error) {
      console.log("STORE DATA NOT EXIST ::: ", daLayer?.id);
    }

    // IF DATA ALREADY EXIST
    if (chainDataExist) {
      const lastCommit = await getLastCommit(
        path.join(__dirname, `../src/projects/da/${daLayer.id}.ts`)
      );
      // FOUND COMMIT HISTORY BEFORE 24 HRS 
      if (
        (lastCommit && !has24HoursPassed(new Date(lastCommit.date))) ||
        !lastCommit
      ) {
        console.log("STORE DATA EXPIRED ::: UPDATING", daLayer?.id);
        await saveL2DataToFile(
          path.join(__dirname, `../data/projects/da/${daLayer.id}.json`),
          JSON.stringify(daLayer)
        );
      }
    } else {
      // IF DATA UNAVAILABLE
      console.log("STORE DATA ::: NEW", daLayer?.id);

      await saveL2DataToFile(
        path.join(__dirname, `../data/projects/da/${daLayer.id}.json`),
        JSON.stringify(daLayer)
      );
    }
  }
};
main();
