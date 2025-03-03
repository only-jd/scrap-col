"use client";
import React, { useState, useEffect } from "react";
import parse from "html-react-parser";

// Define interfaces for your data structure
interface ContentItem {
  content?: string;
  table?: string;
  list?: string;
}

interface Section {
  title: string;
  content: ContentItem[];
}

interface StateData {
  sections: Section[];
  state?: string;
}

// List of all states with their corresponding file names
const stateFileMapping = {
  "Andaman & Nicobar": "andaman-and-nicobar-islands",
  "Andhra Pradesh": "andhra-pradesh",
  "Arunachal Pradesh": "arunachal-pradesh",
  Assam: "assam", // Fixed typo from "assamh" to "assam"
  Bihar: "bihar",
  Chandigarh: "chandigarh",
  Delhi: "delhi",
  Gujarat: "gujarat",
  "Himachal Pradesh": "himachal-pradesh",
  "Jammu & Kashmir": "jammu-kashmir",
  Jharkhand: "jharkhand",
  Karnataka: "karnataka",
  Kerala: "kerala",
  Maharashtra: "maharashtra",
  Odisha: "odisha",
  Puducherry: "puducherry",
  Punjab: "punjab",
  Rajasthan: "rajasthan",
  "Tamil Nadu": "tamilnadu",
  Telangana: "telangana",
  Uttarakhand: "uttarakhand",
  "Uttar Pradesh": "uttarpradesh",
  "West Bengal": "west-bengal",
};

// Create array of states from the keys of stateFileMapping
const allStates = Object.keys(stateFileMapping);

// This function helps us import all JSON files statically
// to avoid dynamic import issues in Next.js
const importStateData = () => {
  // This is a workaround for Next.js dynamic imports
  return {
    // You'll need to import all your state files here
    "andaman-and-nicobar-islands": () =>
      import("@/src/data/andaman-and-nicobar-islandsData.json"),
    "andhra-pradesh": () => import("@/src/data/andhra-pradeshData.json"),
    "arunachal-pradesh": () => import("@/src/data/arunachal-pradeshData.json"),
    assam: () => import("@/src/data/assamhData.json"),
    bihar: () => import("@/src/data/biharData.json"),
    chandigarh: () => import("@/src/data/chandigarhData.json"),
    delhi: () => import("@/src/data/delhiData.json"),
    gujarat: () => import("@/src/data/gujaratData.json"),
    "himachal-pradesh": () => import("@/src/data/himachal-pradeshData.json"),
    "jammu-kashmir": () => import("@/src/data/jammu-kashmirData.json"),
    jharkhand: () => import("@/src/data/jharkhandData.json"),
    karnataka: () => import("@/src/data/karnatakaData.json"),
    kerala: () => import("@/src/data/keralaData.json"),
    maharashtra: () => import("@/src/data/maharashtraData.json"),
    odisha: () => import("@/src/data/odishaData.json"),
    puducherry: () => import("@/src/data/puducherryData.json"),
    punjab: () => import("@/src/data/punjabData.json"),
    rajasthan: () => import("@/src/data/rajasthanData.json"),
    tamilnadu: () => import("@/src/data/tamilnaduData.json"),
    telangana: () => import("@/src/data/telanganaData.json"),
    uttarakhand: () => import("@/src/data/uttarakhandData.json"),
    uttarpradesh: () => import("@/src/data/uttarpradeshData.json"),
    "west-bengal": () => import("@/src/data/west-bengalData.json"),
  };
};

const College: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string>("Gujarat");
  const [stateData, setStateData] = useState<StateData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Function to fetch state data
  const fetchStateData = async (state: string) => {
    setLoading(true);
    try {
      // Get the file name from the mapping
      const fileName = stateFileMapping[state];

      if (!fileName) {
        throw new Error(`No file mapping found for state: ${state}`);
      }

      // Use our import map to get the correct import function
      const importMap = importStateData();
      if (!importMap[fileName]) {
        console.error(`No import function for file: ${fileName}`);
        throw new Error(`Data file not available for ${state}`);
      }

      // Import the JSON file using our map
      const stateModule = await importMap[fileName]();
      console.log(
        `Successfully loaded data for ${state}:`,
        stateModule.default
      );
      setStateData(stateModule.default);
    } catch (error) {
      console.error(`Error loading data for ${state}:`, error);
      setStateData(null);
    } finally {
      setLoading(false);
    }
  };

  // Load data when selected state changes
  useEffect(() => {
    fetchStateData(selectedState);
  }, [selectedState]);

  // Function to add custom styling to HTML content
  const parseWithStyles = (htmlContent: string) => {
    if (!htmlContent) return null;

    // Add custom classes to tables
    let styledHtml = htmlContent
      .replace(/<table/g, '<table class="w-full border-collapse my-4"')
      .replace(/<th/g, '<th class="bg-blue-500 text-white p-3 text-left"')
      .replace(/<td/g, '<td class="border border-gray-300 p-3"')
      .replace(/<tr/g, '<tr class="even:bg-gray-100"');

    // Add custom classes to lists
    styledHtml = styledHtml
      .replace(/<ul/g, '<ul class="list-disc pl-8 my-4 space-y-2"')
      .replace(/<li/g, '<li class="mb-2 leading-relaxed"');

    return parse(styledHtml);
  };

  // Debug information about current state
  console.log("Current selected state:", selectedState);
  console.log("Current state data:", stateData);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white shadow-md p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-blue-600">MBBS in States</h2>
        <div className="space-y-1 max-h-screen overflow-y-auto">
          {allStates.map((state) => (
            <button
              key={state}
              onClick={() => setSelectedState(state)}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                selectedState === state
                  ? "bg-blue-500 text-white"
                  : "hover:bg-blue-100"
              }`}
            >
              MBBS In {state}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : stateData ? (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-blue-700 mb-6">
              MBBS in {selectedState} - {new Date().getFullYear()}
            </h1>

            {stateData.sections?.map((section, index) => (
              <div key={`section-${index}`} className="mb-8">
                {/* Section titles */}
                {index !== 0 && (
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">
                    {section.title}
                  </h2>
                )}

                {/* Section content */}
                {section.content?.map((item, idx) => (
                  <div key={`content-${index}-${idx}`} className="mb-4">
                    {/* Text content */}
                    {item.content && (
                      <p className="mb-4 text-gray-800 leading-relaxed">
                        {item.content}
                      </p>
                    )}

                    {/* Table content */}
                    {item.table && (
                      <div className="my-4 overflow-x-auto">
                        {parseWithStyles(item.table)}
                      </div>
                    )}

                    {/* List content */}
                    {item.list && (
                      <div className="my-4">{parseWithStyles(item.list)}</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12">
            <h3 className="text-xl text-red-500">
              No data available for {selectedState}
            </h3>
            <p className="mt-2">
              Please select another state from the sidebar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default College;
