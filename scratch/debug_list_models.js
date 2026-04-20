const apiKey = "AIzaSyB9Qu3_euukAfiWlL4GZiiwYOKBUTp7JNw";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.models) {
        console.log("SUCCESS: MODELS FOUND");
        console.log(`Model Count: ${data.models.length}`);
        // Log first few to verify
        data.models.slice(0, 3).forEach(m => console.log(`- ${m.name}`));
    } else {
        console.log("FAILED: NO MODELS OR ERROR");
        console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
