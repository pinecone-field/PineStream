---
slug: introduction
id: zwwsdp9xyz8y
type: challenge
title: Introduction to PineStream
teaser: Welcome to PineStream! This challenge introduces you to the AI-powered movie
  streaming platform you'll be extending and helps you set up your development environment.
notes:
- type: text
  contents: "# ![logo.png](../assets/logo.png) Welcome to PineStream Workshop!\n\nIn
    this workshop, you'll add AI-powered features to a sample movie streaming platform.\n\nYou
    will go through the following challanges:\n\n- Setup & Introduction  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\U0001F448
    ***you're here!***\n-  Embeddings Generation\n-  User Recommendations\n-  Semantic
    Search Implementation\n-  Query Expansion\n-  Similar Movies (RAG Pipeline)"
- type: text
  contents: |
    # Setup & Introduction

    In this challenge you will:
    - understabd the overall structure of the existing application
    - build and run the aplication
    - familiarize itself with the requirements for the new features
    - configure your own API keys for the externall tools we need
tabs:
- id: 95lxilof1ekx
  title: IDE
  type: service
  hostname: pinestream
  port: 8080
- id: gawgbwhtkafs
  title: Terminal
  type: terminal
  hostname: pinestream
  workdir: /app/webapp
- id: na5xcxfccg1c
  title: PineStream
  type: service
  hostname: pinestream
  port: 3000
difficulty: basic
enhanced_loading: null
---

In this challenge you will:
- understabd the overall structure of the existing application
- build and run the aplication
- familiarize itself with the requirements for the new features
- configure your own API keys for the externall tools we need


🎬 What is PineStream?
===
PineStream is a movie streaming platform that you'll enhance with AI-powered features. It currently has basic functionality such us:
 - browsing movies,
 - searching for movies by keywords
 - showing movie details
 - marking movies as watched

You can explore the code of the application is the [IDE tab](tab-0) if you wish. It's a Nuxt-based web application but **you don't need to understand how it works.**

There are dedicated and clearly marked places in the code where you'll be making changes.


🚀 Build and Run the Existing Application
===

To build and run (in devloper mode) the existing application you need to go to the [Terminal](tab-1) and run the follwing code
```run
cd /app/webapp
pnpm dev
```
When you see a message `ℹ Vite server warmed up in ____ms ` - the application is up and runnign. You can se it in the [PineStream tab](tab-2).

> [!WARNING]
>  The script will print links to the application like:
>    ```nocopy
>    ➜ Local:    http://0.0.0.0:3000/
>    ➜ Network:  http://10.216.5.73:3000/ [QR code]
>    ```
>   ### DO NOT CLICK ON THOSE!
>   They will try to open the app in your browser but it doesn't have direct acces to the application running inside the workshop environment.


👀 Explore the application
===
Explore the PineStream application and notice the following
- The home page shows a herro banner (reandom movie) and a grid with all movies below. **You will add a "Recommended movies" section betwen the two**
- Click on a movie to see the details. Note the empty space in the bottom right. **You will add "Similar movies" section there**
- You can search for movies by keywords. Notice the semantic search *(the ✨ icon)*  doesn't return any results.  **You will implement the "Semantic Search" functionality**
- You can mark movies as "watched". The `Profile` page shows a list of watched movies and allows you to builk add to it.
- The `Admin` page shows statistics about movies. You should see `N/A` for embeddings. **You will add the feature to generate embeddings**

To implement those functionalites you'll need two external services:
- A Vector Database - **you'll use Pinecone** to store and query vectors
- An LLM -  **you'll use Groq** to interact with LLMs like "llama-3.1-8b"

🪪 Provide Pinecone and Groq API keys
===

To implement those functionalites you'll need to use two external services:
- **Pinecone**  - a vector database
- **Groq** - a cloud-based LLM provider

Both offer **free plans that are sufficient for the needs of this workshop**!

## Get the API keys

### Pinecone API Key

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create an account or sign in
3. Create a new project (or use existing)
4. Go to the "API Keys" page and create an API key.  Save it locally to use it later

### Groq API Key

1. Go to [Groq Console](https://console.groq.com/)
2. Create an account or sign in
3. Go to the "API Keys" page and create an API key.  Save it locally to use it later

## Configure The Environment Variables
Go to the  [Terminal](tab-1) and stop the application by pressing `Ctrl+C`
Copy the  `.example.env` file into `.env`:

```run
cd /app/webapp
cp .example.env .env
```
Go to the  [IDE tab](tab-0) and open the `.env` file. Find the line:
```nocopy
PINECONE_API_KEY=your-pinecone-api-key-here
```
and replace `your-pinecone-api-key-here` with the API key you gor from Pinecone

Find the line:
```nocopy
GROQ_API_KEY=your-groq-api-key-here
```
and replace `your-groq-api-key-here` with the API key you gor from Pinecone

🛠️ Other configuration
===

Notice the `.env` file has some other configuration

## Movies Database
The workshop comes with two different databases. The `movies.db` is about 10K movies and `movies_small.db` has 500 movies.

### "Starter" Pincone Account (free)
You should use `movies_small.db` otherwise you'll hit some limitations the free plan has.

### "Standard" Pincone Account (paid)
If you don't mind being charged for teh usage and waiting a bit longer for the initial upsert you can use the `movies.db` file.
You could then also configure bigger batch sizes and more concurent processes.:
```nocopy
# Maximum chunks per batch for dense embedding generation (default: 50)
DENSE_BATCH_SIZE=50
# Maximum records per batch for sparse embedding generation (default: 50)
SPARSE_BATCH_SIZE=50
# Maximum concurrent batches for embedding generation (default: 1)
MAX_CONCURRENT_BATCHES=1
```
Consult [Pinecone Database limits](https://docs.pinecone.io/reference/api/database-limits) first!

## Indexes

The application uses two Pinecone indexes:
- `movies-dense` - for dense vectors
- `movies-sparse` - dor sparse vectors

Next challanges will provide more information about what those are. At this point, what you need to know is that **you don't have to manually create those**.
The application will do it for you. In case you are interested how it is done, have a look at the `ensureIndexesExist` function in `server/utils/pinecone.ts` file.

✅ Verify Your Setup
===

Go to the [Terminal](tab-1). If the application is still runnign - stop it by pressing `Ctrl+C`. Then run it again:
```run
cd /app/webapp
pnpm dev
```
> [!NOTE]
>  Normally you don't need to restart the  development server. It will pich the changes you make in the code and update the application on the fly. In this particular case though, you changed the configuration which is only read once as application start. That's is why the restart is needed.

Once tha application is running agaian, go to the [PineStream tab](tab-2) and click on `Admin` button in the header.
The Admin page now should show 500 movies *(if you are using `movies_small.db`)* and the number of dense and sparse vectors should be now `0` and not `N/A`.
You can also go to [Pinecone Console](https://app.pinecone.io/) and confirm the two indexes are created.

