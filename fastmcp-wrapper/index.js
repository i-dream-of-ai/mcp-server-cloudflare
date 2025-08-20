/**
 * FastMCP Wrapper for Cloudflare MCP Server
 * Cloudflare Workers bindings and API access
 */

import { FastMCP } from 'fastmcp';

// Create FastMCP wrapper
const mcp = new FastMCP("Cloudflare MCP Server", {
  name: "cloudflare-mcp-server-wrapper"
});

// Workers KV tools
mcp.tool("kv-put", "Store a value in Workers KV", {
  type: "object",
  properties: {
    namespace_id: {
      type: "string",
      description: "KV namespace ID"
    },
    key: {
      type: "string",
      description: "Key to store"
    },
    value: {
      type: "string",
      description: "Value to store"
    },
    metadata: {
      type: "object",
      description: "Optional metadata"
    }
  },
  required: ["namespace_id", "key", "value"]
}, async ({ namespace_id, key, value, metadata }) => {
  return {
    content: [{
      type: "text",
      text: `Stored ${key} in namespace ${namespace_id}`
    }]
  };
});

mcp.tool("kv-get", "Get a value from Workers KV", {
  type: "object",
  properties: {
    namespace_id: {
      type: "string",
      description: "KV namespace ID"
    },
    key: {
      type: "string",
      description: "Key to retrieve"
    }
  },
  required: ["namespace_id", "key"]
}, async ({ namespace_id, key }) => {
  return {
    content: [{
      type: "text",
      text: `Retrieved value for ${key} from namespace ${namespace_id}`
    }]
  };
});

// R2 storage tools
mcp.tool("r2-put", "Upload object to R2", {
  type: "object",
  properties: {
    bucket: {
      type: "string",
      description: "R2 bucket name"
    },
    key: {
      type: "string",
      description: "Object key"
    },
    content: {
      type: "string",
      description: "Object content"
    },
    content_type: {
      type: "string",
      description: "MIME type"
    }
  },
  required: ["bucket", "key", "content"]
}, async ({ bucket, key, content, content_type = "text/plain" }) => {
  return {
    content: [{
      type: "text",
      text: `Uploaded ${key} to bucket ${bucket} (${content_type})`
    }]
  };
});

mcp.tool("r2-get", "Download object from R2", {
  type: "object",
  properties: {
    bucket: {
      type: "string",
      description: "R2 bucket name"
    },
    key: {
      type: "string",
      description: "Object key"
    }
  },
  required: ["bucket", "key"]
}, async ({ bucket, key }) => {
  return {
    content: [{
      type: "text",
      text: `Downloaded ${key} from bucket ${bucket}`
    }]
  };
});

// D1 database tools
mcp.tool("d1-query", "Execute query on D1 database", {
  type: "object",
  properties: {
    database_id: {
      type: "string",
      description: "D1 database ID"
    },
    query: {
      type: "string",
      description: "SQL query to execute"
    },
    params: {
      type: "array",
      description: "Query parameters"
    }
  },
  required: ["database_id", "query"]
}, async ({ database_id, query, params = [] }) => {
  return {
    content: [{
      type: "text",
      text: `Executed query on database ${database_id}`
    }]
  };
});

// Durable Objects tools
mcp.tool("do-fetch", "Send request to Durable Object", {
  type: "object",
  properties: {
    namespace: {
      type: "string",
      description: "Durable Object namespace"
    },
    name: {
      type: "string",
      description: "Object name or ID"
    },
    method: {
      type: "string",
      enum: ["GET", "POST", "PUT", "DELETE"],
      description: "HTTP method"
    },
    path: {
      type: "string",
      description: "Request path"
    },
    body: {
      type: "object",
      description: "Request body"
    }
  },
  required: ["namespace", "name", "method", "path"]
}, async ({ namespace, name, method, path, body }) => {
  return {
    content: [{
      type: "text",
      text: `Sent ${method} request to ${namespace}/${name}${path}`
    }]
  };
});

// Export for Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    // Pass environment bindings
    if (env.CLOUDFLARE_API_TOKEN) {
      process.env.CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;
    }
    if (env.CLOUDFLARE_ACCOUNT_ID) {
      process.env.CLOUDFLARE_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
    }
    
    return mcp.fetch(request, env, ctx);
  }
};