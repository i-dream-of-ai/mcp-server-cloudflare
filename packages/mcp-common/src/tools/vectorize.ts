import { getCloudflareClient } from '../cloudflare-api'
import { MISSING_ACCOUNT_ID_RESPONSE } from '../constants'
import {
	VectorizeIndexConfigSchema,
	VectorizeIndexDescriptionSchema,
	VectorizeIndexNameSchema,
	VectorizeListDirectionParam,
	VectorizeListOrderParam,
	VectorizeListPageParam,
	VectorizeListPerPageParam,
	VectorizeNdjsonBodySchema,
	VectorizeQueryFilterSchema,
	VectorizeQueryReturnMetadataSchema,
	VectorizeQueryReturnValuesSchema,
	VectorizeQueryTopKSchema,
	VectorizeQueryVectorSchema,
	VectorizeUnparsableBehaviorSchema,
	VectorizeVectorIdListSchema,
} from '../types/vectorize'

import type { CloudflareMcpAgent } from '../types/cloudflare-mcp-agent'

/**
 * Registers Vectorize Index management tools with the MCP agent.
 * @param agent - The Cloudflare MCP agent instance.
 */
export function registerVectorizeTools(agent: CloudflareMcpAgent) {
	// --- vectorize_index_create ---
	agent.server.tool(
		'vectorize_index_create',
		'Creates a new Vectorize Index. Use this when a user wants to set up a new vector database.',
		{
			name: VectorizeIndexNameSchema,
			config: VectorizeIndexConfigSchema,
			description: VectorizeIndexDescriptionSchema,
		},
		async (params) => {
			try {
				const account_id = await agent.getActiveAccountId()
				if (!account_id) {
					return MISSING_ACCOUNT_ID_RESPONSE
				}
				const client = getCloudflareClient(agent.props.accessToken)

				const result = await client.vectorize.indexes.create({
					account_id,
					...params,
				})

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result ?? 'Index created successfully (no detailed response).'),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error creating Vectorize Index: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
				}
			}
		}
	)

	// --- vectorize_index_list ---
	agent.server.tool(
		'vectorize_index_list',
		'Lists Vectorize Indexes in the current account, with optional pagination. Use this when a user asks to see their indexes.',
		{
			page: VectorizeListPageParam,
			per_page: VectorizeListPerPageParam,
			order: VectorizeListOrderParam,
			direction: VectorizeListDirectionParam,
		},
		async ({ page, per_page, order, direction }) => {
			try {
				const account_id = await agent.getActiveAccountId()
				if (!account_id) {
					return MISSING_ACCOUNT_ID_RESPONSE
				}
				const client = getCloudflareClient(agent.props.accessToken)

				const response = await client.vectorize.indexes.list(
					{ account_id },
					{
						query: {
							page: page ?? undefined,
							per_page: per_page ?? undefined,
							order: order ?? undefined,
							direction: direction ?? undefined,
						},
					}
				)

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error listing Vectorize Indexes: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
				}
			}
		}
	)

	// --- vectorize_index_get ---
	agent.server.tool(
		'vectorize_index_get',
		'Retrieves the details and configuration of a specific Vectorize Index by its name.',
		{
			name: VectorizeIndexNameSchema,
		},
		async ({ name }) => {
			try {
				const account_id = await agent.getActiveAccountId()
				if (!account_id) {
					return MISSING_ACCOUNT_ID_RESPONSE
				}
				const client = getCloudflareClient(agent.props.accessToken)

				const result = await client.vectorize.indexes.get(name, { account_id })

				if (!result) {
					return {
						content: [
							{
								type: 'text',
								text: `Error: Vectorize Index "${name}" not found.`,
							},
						],
					}
				}
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error getting Vectorize Index "${name}": ${error instanceof Error ? error.message : String(error)}`,
						},
					],
				}
			}
		}
	)

	// --- vectorize_index_delete ---
	agent.server.tool(
		'vectorize_index_delete',
		'Deletes a specific Vectorize Index by its name. This action is permanent.',
		{
			name: VectorizeIndexNameSchema,
		},
		async ({ name }) => {
			try {
				const account_id = await agent.getActiveAccountId()
				if (!account_id) {
					return MISSING_ACCOUNT_ID_RESPONSE
				}
				const client = getCloudflareClient(agent.props.accessToken)

				await client.vectorize.indexes.delete(name, { account_id })

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								success: true,
								message: `Vectorize Index "${name}" deleted successfully.`,
							}),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error deleting Vectorize Index "${name}": ${error instanceof Error ? error.message : String(error)}`,
						},
					],
				}
			}
		}
	)

	// --- vectorize_index_info ---
	agent.server.tool(
		'vectorize_index_info',
		'Gets operational information about a Vectorize Index, such as the number of vectors it contains.',
		{
			name: VectorizeIndexNameSchema,
		},
		async ({ name }) => {
			try {
				const account_id = await agent.getActiveAccountId()
				if (!account_id) {
					return MISSING_ACCOUNT_ID_RESPONSE
				}
				const client = getCloudflareClient(agent.props.accessToken)

				const result = await client.vectorize.indexes.info(name, { account_id })

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result ?? `Could not retrieve info for index "${name}".`),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error getting info for Vectorize Index "${name}": ${error instanceof Error ? error.message : String(error)}`,
						},
					],
				}
			}
		}
	)

	// --- vectorize_index_insert ---
	agent.server.tool(
		'vectorize_index_insert',
		'Inserts vectors into a specified Vectorize Index using NDJSON format. Returns a mutation ID.',
		{
			name: VectorizeIndexNameSchema,
			vectors_ndjson: VectorizeNdjsonBodySchema,
			unparsable_behavior: VectorizeUnparsableBehaviorSchema,
		},
		async ({ name, vectors_ndjson, unparsable_behavior }) => {
			try {
				const account_id = await agent.getActiveAccountId()
				if (!account_id) {
					return MISSING_ACCOUNT_ID_RESPONSE
				}
				const client = getCloudflareClient(agent.props.accessToken)

				const result = await client.vectorize.indexes.insert(name, {
					account_id,
					body: vectors_ndjson,
					'unparsable-behavior': unparsable_behavior,
				})

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result ?? 'Insert operation initiated (no detailed response).'),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error inserting vectors into Vectorize Index "${name}": ${error instanceof Error ? error.message : String(error)}`,
						},
					],
				}
			}
		}
	)

	// --- vectorize_index_upsert ---
	agent.server.tool(
		'vectorize_index_upsert',
		'Upserts vectors into a specified Vectorize Index using NDJSON format (inserts new, updates existing). Returns a mutation ID.',
		{
			name: VectorizeIndexNameSchema,
			vectors_ndjson: VectorizeNdjsonBodySchema,
			unparsable_behavior: VectorizeUnparsableBehaviorSchema,
		},
		async ({ name, vectors_ndjson, unparsable_behavior }) => {
			try {
				const account_id = await agent.getActiveAccountId()
				if (!account_id) {
					return MISSING_ACCOUNT_ID_RESPONSE
				}
				const client = getCloudflareClient(agent.props.accessToken)

				const result = await client.vectorize.indexes.upsert(name, {
					account_id,
					body: vectors_ndjson,
					'unparsable-behavior': unparsable_behavior,
				})

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result ?? 'Upsert operation initiated (no detailed response).'),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error upserting vectors into Vectorize Index "${name}": ${error instanceof Error ? error.message : String(error)}`,
						},
					],
				}
			}
		}
	)

	// --- vectorize_index_query ---
	agent.server.tool(
		'vectorize_index_query',
		'Finds vectors in an index that are closest (nearest neighbors) to a given query vector. Can optionally filter by metadata.',
		{
			name: VectorizeIndexNameSchema,
			vector: VectorizeQueryVectorSchema,
			filter: VectorizeQueryFilterSchema,
			return_metadata: VectorizeQueryReturnMetadataSchema,
			return_values: VectorizeQueryReturnValuesSchema,
			top_k: VectorizeQueryTopKSchema,
		},
		async ({ name, vector, filter, return_metadata, return_values, top_k }) => {
			try {
				const account_id = await agent.getActiveAccountId()
				if (!account_id) {
					return MISSING_ACCOUNT_ID_RESPONSE
				}
				const client = getCloudflareClient(agent.props.accessToken)

				const result = await client.vectorize.indexes.query(name, {
					account_id,
					vector,
					filter, // Pass filter directly as SDK expects 'unknown'
					returnMetadata: return_metadata,
					returnValues: return_values,
					topK: top_k,
				})

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result ?? 'Query executed, but no results returned.'),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error querying Vectorize Index "${name}": ${error instanceof Error ? error.message : String(error)}`,
						},
					],
				}
			}
		}
	)

	// --- vectorize_index_get_by_ids ---
	agent.server.tool(
		'vectorize_index_get_by_ids',
		'Retrieves specific vectors from an index by their unique identifiers.',
		{
			name: VectorizeIndexNameSchema,
			ids: VectorizeVectorIdListSchema,
		},
		async ({ name, ids }) => {
			try {
				const account_id = await agent.getActiveAccountId()
				if (!account_id) {
					return MISSING_ACCOUNT_ID_RESPONSE
				}
				const client = getCloudflareClient(agent.props.accessToken)

				const result = await client.vectorize.indexes.getByIds(name, {
					account_id,
					ids,
				})

				// The SDK types this response as 'unknown', needs careful handling
				if (result === null || result === undefined) {
					return {
						content: [
							{
								type: 'text',
								text: `Error: No vectors found for the provided IDs in index "${name}".`,
							},
						],
					}
				}
				// Format success response
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error getting vectors by ID from Vectorize Index "${name}": ${error instanceof Error ? error.message : String(error)}`,
						},
					],
				}
			}
		}
	)

	// --- vectorize_index_delete_by_ids ---
	agent.server.tool(
		'vectorize_index_delete_by_ids',
		'Deletes specific vectors from an index by their unique identifiers. Returns a mutation ID.',
		{
			name: VectorizeIndexNameSchema,
			ids: VectorizeVectorIdListSchema,
		},
		async ({ name, ids }) => {
			try {
				const account_id = await agent.getActiveAccountId()
				if (!account_id) {
					return MISSING_ACCOUNT_ID_RESPONSE
				}
				const client = getCloudflareClient(agent.props.accessToken)

				const result = await client.vectorize.indexes.deleteByIds(name, {
					account_id,
					ids,
				})

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(
								result ?? 'Delete by IDs operation initiated (no detailed response).'
							),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error deleting vectors by ID from Vectorize Index "${name}": ${error instanceof Error ? error.message : String(error)}`,
						},
					],
				}
			}
		}
	)
}
