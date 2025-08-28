---
slug: introduction
id: zwwsdp9xyz8y
type: challenge
title: Introduction to PineStream
teaser: This challenge introduces you to PineStream - the sample movie streaming platform
  you'll be extending. It also helps you set up your development environment.
notes:
- type: text
  contents: "# ![logo.png](../assets/logo.png) Welcome to PineStream Workshop!\n\nIn
    this workshop, you'll add AI-powered features to a sample movie streaming platform.\n\nYou
    will go through the following challenges:\n\n- Setup & Introduction  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\U0001F448
    ***you're here!***\n- Embeddings Generation\n- User Recommendations\n- Semantic
    Search Implementation\n- Query Expansion\n- Similar Movies (RAG Pipeline)\n"
- type: text
  contents: |
    # Setup & Introduction

    In this challenge, you will:
    - Understand the overall structure of the existing application
    - Build and run the application
    - Familiarize yourself with the requirements for the new features
    - Configure your own API keys for the external tools we need
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

In this challenge, you will:

- Understand the overall structure of the existing application
- Build and run the application
- Familiarize yourself with the requirements for the new features
- Configure your own API keys for the external tools we need

# 🎬 What is PineStream?
===

PineStream is a movie streaming platform that you'll enhance with AI-powered features. It currently has basic functionality such as:

- browsing movies,
- searching for movies by keywords
- showing movie details
- marking movies as watched

It's a Nuxt-based web application, but **you don't need to understand how it works.**

The places where you'll implement the given logic in the code are clearly marked and surrounded by comments explaining what the application expects.

# 🚀 Build and Run the Existing Application
===

To build and run (in developer mode) the existing application, you need to go to the [Terminal](tab-1) and run the following code

```run
cd /app/webapp
pnpm dev
```

When you see a message `ℹ Vite server warmed up in ____ms `, the application is up and running. You can see it in the [PineStream tab](tab-2).

> [!WARNING]
> The script will print links to the application like:
>
> ```nocopy
> ➜ Local:    http://0.0.0.0:3000/
> ➜ Network:  http://10.216.5.73:3000/ [QR code]
> ```
>
> ### DO NOT CLICK ON THOSE!
>
> They will try to open the app in your browser. However, the browser doesn't have direct access to the application running inside the workshop environment.

# 👀 Explore the application
===

Explore the PineStream application (in the [PineStream tab](tab-2)) and notice the following.

- The home page shows a hero banner (a random movie) and a grid with all movies below it. **You will add a "Recommended movies" section between the two**
- Click on a movie to see the details. Note the empty space in the bottom right. **You will add the "Similar movies" section there**
- You can search for movies by keywords. Notice that the semantic search _(the ✨ icon)_ returns no results. **You will implement the "Semantic Search" functionality**
- You can mark movies as "watched". The `Profile` page shows a list of movies you have watched and allows you to add more in bulk.
- The `Admin` page shows statistics about movies. You should see `N/A` for embeddings. **You will add the feature to generate embeddings**

To implement those functionalities, you'll need two external services:

- A Vector Database - **you'll use Pinecone** to store and query vectors
- An LLM - **you'll use Groq** to interact with LLMs like "llama-3.1-8b"

# 🪪 Provide Pinecone and Groq API keys
===

To implement the new functionalities, you'll need to use two external services:

- **Pinecone** - a vector database
- **Groq** - a cloud-based LLM provider

Both offer **free plans that are sufficient for the needs of this workshop**!

## Get the API keys

### Pinecone API Key

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create an account or sign in
3. Create a new project (or use an existing one)
4. Create an API key on the "API Keys" page. Save it locally to use it later

### Groq API Key

1. Go to [Groq Console](https://console.groq.com/)
2. Create an account or sign in
3. Create an API key on the "API Keys" page. Save it locally to use it later

## Configure The Environment Variables

Go to the [Terminal](tab-1) and stop the application by pressing `Ctrl+C`
Copy the `.example.env` file into `.env`:

```run
cd /app/webapp
cp .example.env .env
```

Go to the [IDE tab](tab-0) and open the `.env` file. Find the line:

```nocopy
PINECONE_API_KEY=your-pinecone-api-key-here
```

Replace `your-pinecone-api-key-here` with the API key you got from Pinecone.

Find the line:

```nocopy
GROQ_API_KEY=your-groq-api-key-here
```

Replace `your-groq-api-key-here` with the API key you got from Groq.

# 🛠️ Other configuration
===

Notice the `.env` file has some other configuration.

## Movies Database

The workshop comes with two different databases. The `movies.db` contains about 10K movies, and the `movies_small.db` contains only 500 movies. Which one to use depends on your Pinecone plan.

### "Starter" Pinecone Account (free)

You should use `movies_small.db`; otherwise, due to the free plan's bandwidth limitations, you'll encounter issues during the initial import.

### "Standard" Pinecone Account (paid)

You can use the `movies.db` database if you are willing to pay for the resource usage and wait a bit longer for the initial upsert. In such a case, you can configure bigger batch sizes and more concurrent processes:

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
- `movies-sparse` - for sparse vectors

The next challenges will provide more information about those. At this point, you need to know that you don't have to manually create them.
The application will do it for you. If you are interested in how it is done, have a look at the `ensureIndexesExist` function in the `server/utils/pinecone.ts` file.

# ✅ Verify Your Setup
===

Go to the [Terminal](tab-1). If the application is still running, stop it by pressing `Ctrl+C`. Then rerun it:

```run
cd /app/webapp
pnpm dev
```

> [!NOTE]
> Normally, you don't need to restart the development server. It will pick the changes you make in the code and update the application on the fly. In this case, you changed the configuration, which is only read once at application start. That's why the restart is needed.

Once the application is running again, go to the [PineStream tab](tab-2) and click the `Admin` button in the header.
The Admin page should now show 500 movies (if you are using `movies_small.db`), and the number of dense and sparse vectors should now be `0` and not `N/A`.
You can also go to [Pinecone Console](https://app.pinecone.io/) and confirm that the two indexes are created.
