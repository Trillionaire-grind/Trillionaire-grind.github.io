/* this is here to help us turn the text that we are getting from the website to something that can be used 
for our individual secret page
the website : https://tactiq.io/tools/youtube-transcript 
*/

function removeTimestamps(inputString) {
    // Regular expression to match timestamps in the format "00:08:15.639"
    const timestampRegex = /\d{2}:\d{2}:\d{2}\.\d{3}\n?/g;
    
    // Replace all timestamps with an empty string
    return inputString.replace(timestampRegex, '');
}

function formatString(inputString) {
    // Split the input string into lines
    let lines = inputString.split('\n');
    
    // Initialize an array to hold the formatted result
    let formattedLines = [];

    // Loop through each line
    lines.forEach(line => {
        // Skip empty lines
        if (line.trim() === '') {
            formattedLines.push('');
            return;
        }

        // Split the line into words
        let words = line.split(' ');

        // Split the words into chunks of 18 words
        while (words.length > 18) {
            formattedLines.push(words.slice(0, 18).join(' '));
            words = words.slice(18);
        }

        // Add the remaining words as the last line
        if (words.length > 0) {
            formattedLines.push(words.join(' '));
        }
    });

    // Join the formatted lines back into a single string
    return formattedLines.join('\n');
}
