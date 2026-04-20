const apiKey = "AIzaSyCo_CJIOcLWn48oLSZKhnoReHxacDnA1J8";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.models) {
        console.log("AVAILABLE MODELS:");
        data.models.forEach(m => console.log(`- ${m.name}`));
    } else {
        console.log("NO MODELS FOUND OR ERROR:");
        console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
