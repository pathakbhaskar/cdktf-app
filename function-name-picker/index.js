let shuffledNames = [];
let currentIndex = 0;


exports.handler = async (event) => {
  console.log('Received event:', event);
  const names = JSON.parse(process.env.NAMES || '["Amazon EC2","Amazon RDS","Amazon S3","Amazon VPC"]');
  const shuffle = process.env.SHUFFLE === 'true';


  if (!shuffle) {
    // Return a random name from the array if shuffling is disabled
    const randomName = names[Math.floor(Math.random() * names.length)];
    return {
      statusCode: 200,
      body: JSON.stringify(randomName),
    };
  } else {
    // If shuffling is enabled, shuffle the list and persist the state
    if (shuffledNames.length === 0 || currentIndex >= shuffledNames.length) {
      shuffledNames = shuffleArray([...names]); // Create a shuffled copy of names
      currentIndex = 0;
    }
    
    const nameToReturn = shuffledNames[currentIndex];
    currentIndex += 1; // Increment the index


    return {
      statusCode: 200,
      body: JSON.stringify(nameToReturn),
    };
  }
};


// Helper function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}