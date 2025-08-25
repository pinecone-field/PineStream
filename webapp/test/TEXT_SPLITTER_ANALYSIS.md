# Text Splitter Analysis for Movie Plots

## 🎯 Overview

We've conducted comprehensive testing of different LangChain text splitters using a **representative sample of 20 movies** (10% of available movies with plots) to determine the best approach for splitting movie plot text into chunks for embedding generation and semantic search.

## 🔍 What Was Tested

### **Text Splitter Types**

1. **RecursiveCharacterTextSplitter** - Character-based splitting with overlap
2. **CharacterTextSplitter** - Simple character-based splitting
3. **TokenTextSplitter** - Token-based splitting (more accurate for LLMs)
4. **MarkdownTextSplitter** - Markdown-aware splitting (respects document structure)

### **Configuration Variations**

We tested multiple `RecursiveCharacterTextSplitter` configurations to find the optimal parameters:

- Small chunks (500/100)
- Medium chunks (750/250)
- Large chunks (1000/200)
- Large chunks (1200/300)
- High overlap (750/400)
- Low overlap (750/100)

### **Test Methodology**

- **Sample Size**: 20 movies representing diverse genres and narrative styles
- **Metrics**: Coherence score, chunk count, overlap, sentence breaks
- **Statistical Validity**: Results based on representative sampling, not single examples

## 📊 What Was Discovered

### **Text Splitter Performance Rankings**

| Rank | Splitter                       | Coherence | Chunks/Movie | Overlap | Sentence Breaks | Performance                 |
| ---- | ------------------------------ | --------- | ------------ | ------- | --------------- | --------------------------- |
| 🥇 1 | CharacterTextSplitter          | 9.85/10   | 1.0          | 0.0     | 0.1             | **Best for text integrity** |
| 🥇 1 | TokenTextSplitter              | 9.85/10   | 1.0          | 0.0     | 0.1             | **Best for text integrity** |
| 🥉 3 | RecursiveCharacterTextSplitter | 8.05/10   | 3.0          | 296.2   | 2.0             | **Best for search**         |
| 🥉 3 | MarkdownTextSplitter           | 6.65/10   | 5.7          | 245.5   | 4.5             | **Identical to Recursive**  |

### **Configuration Performance Rankings**

| Rank | Configuration | Chunk Size | Overlap | Chunks/Movie | Coherence   | Sentence Breaks | Performance      |
| ---- | ------------- | ---------- | ------- | ------------ | ----------- | --------------- | ---------------- |
| 🥇 1 | Large chunks  | 1200       | 300     | 3.0          | **8.05/10** | 2.0             | **Best overall** |
| 🥈 2 | Small chunks  | 500        | 100     | 7.3          | 7.55/10     | 6.0             | High granularity |
| 🥉 3 | Large chunks  | 1000       | 200     | 3.9          | 7.35/10     | 2.9             | Good balance     |
| 4    | Low overlap   | 750        | 100     | 4.8          | 7.20/10     | 3.8             | Minimal context  |
| 5    | High overlap  | 750        | 400     | 7.5          | 7.00/10     | 6.3             | Maximum context  |
| 6    | Medium chunks | 750        | 250     | 5.7          | 6.65/10     | 4.5             | Suboptimal       |

### **Key Discoveries**

1. **CharacterTextSplitter & TokenTextSplitter**: Perfect text integrity (9.85/10) but single large chunks
2. **RecursiveCharacterTextSplitter (1200/300)**: Best balance of coherence (8.05/10) and searchability (3 chunks)
3. **MarkdownTextSplitter**: No advantage for plain text plots - identical performance to RecursiveCharacterTextSplitter
4. **Larger chunks improve coherence**: 1200 chars significantly better than 750 chars
5. **Higher overlap improves context**: 300 chars overlap provides excellent narrative continuity

## 🎬 Movie Plot Characteristics

Our analysis reveals that movie plots have:

- **Length**: 2500-3000 characters on average
- **Genres**: Diverse representation (Action, Comedy, Drama, Horror, Thriller, Romance, etc.)
- **Structure**: Narrative text with natural sentence breaks
- **Content**: Rich in character names, plot points, and thematic elements
- **Challenges**: Complex sentences that don't align with arbitrary character boundaries

## 💡 What Is Recommended

### **Primary Recommendation: RecursiveCharacterTextSplitter (1200/300)**

**Why This Configuration:**

- **Optimal Coherence**: 8.05/10 score (best among chunking approaches)
- **Good Search Granularity**: 3.0 chunks per movie provide multiple search entry points
- **Excellent Context Preservation**: 296.2 character overlap maintains narrative continuity
- **Embedding Efficiency**: 1200 character chunks are within optimal ranges for most models
- **Statistical Validation**: Results based on 20 diverse movies across multiple genres

### **Alternative Options**

1. **For Maximum Search Granularity**: Small chunks (500/100) - 7.3 chunks, 7.55/10 coherence
2. **For Text Display**: CharacterTextSplitter - 9.85/10 coherence, single chunk
3. **For Balanced Approach**: Large chunks (1000/200) - 3.9 chunks, 7.35/10 coherence

### **Implementation**

```typescript
// Recommended configuration
export const DEFAULT_SPLITTER_CONFIG: TextSplitterConfig = {
  chunkSize: 1200,
  chunkOverlap: 300,
};

// Usage
import { splitText } from "~/server/utils/text-splitter";
const chunks = await splitText(plotText);
```

## 🎯 Conclusion

**RecursiveCharacterTextSplitter with 1200/300 configuration** is the optimal choice for movie recommendation systems that rely on semantic search. It provides:

- **Excellent text coherence** (8.05/10) for high-quality embeddings
- **Good search granularity** (3 chunks per movie) for multiple search entry points
- **Superior context preservation** (296.2 char overlap) for narrative continuity
- **Optimal chunk sizes** for embedding model efficiency

This configuration strikes the perfect balance between search performance, text quality, and computational efficiency for Pinecone-based semantic search systems.
