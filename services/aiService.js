/**
 * Mock AI detection service
 * In a real application, this would call a machine learning model or an external API
 */
export const detectObject = async (imageBuffer) => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Randomly select a mock result
  const mockResults = [
    {
      detected: "Plastic Bottle",
      recyclables: ["Planter pot", "Bird feeder", "Pen holder", "Garden watering tool"],
      confidence: 0.95
    },
    {
      detected: "Cardboard Box",
      recyclables: ["Storage organizer", "Cat house", "Drawer dividers", "Compost"],
      confidence: 0.88
    },
    {
      detected: "Glass Jar",
      recyclables: ["Spice container", "Vase", "Candle holder", "Terrarium"],
      confidence: 0.92
    },
    {
      detected: "Aluminum Can",
      recyclables: ["Pencil holder", "Small lantern", "Cookie cutter", "Plant label"],
      confidence: 0.91
    }
  ];

  return mockResults[Math.floor(Math.random() * mockResults.length)];
};
