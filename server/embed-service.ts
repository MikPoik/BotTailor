/**
 * Embed design orchestration, payload preparation, and host integration service.
 *
 * Responsibilities:
 * - Handles creation, update, retrieval, and deletion of embed designs and components.
 * - Prepares embeddable payloads for public/protected embeds, enforcing host integration rules.
 * - Integrates with Drizzle ORM and shared schema for DB operations.
 * - Used by embed routes and UI designer for all embed-related persistence and rendering.
 *
 * Contracts & Edge Cases:
 * - All schema changes must be reflected in shared/schema.ts and DB migrations.
 * - API contracts must be kept in sync with client and embed consumers.
 * - Embed config must match documented keys (apiUrl, widgetId, embedKey, theme overrides, etc.).
 * - Enforces ownership and protected access for private embeds (embedKey/token required).
 * - Backwards-incompatible changes require migration/versioning and embed.js compatibility.
 */
import { db } from "./db";
import { embedDesigns, embedDesignComponents, chatbotConfigs, CTAConfig } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface CreateEmbedDesignInput {
  chatbotConfigId: number;
  userId: string;
  name?: string;
  description?: string;
  designType?: "minimal" | "compact" | "full";
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  welcomeMessage?: string;
  welcomeType?: "text" | "form" | "buttons";
  inputPlaceholder?: string;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  headerText?: string;
  footerText?: string;
  hideBranding?: boolean;
  customCss?: string;
  ctaConfig?: CTAConfig; // NEW: CTA configuration
}

export interface UpdateEmbedDesignInput {
  name?: string;
  description?: string;
  designType?: "minimal" | "compact" | "full";
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  welcomeMessage?: string;
  welcomeType?: string;
  inputPlaceholder?: string;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  headerText?: string;
  footerText?: string;
  hideBranding?: boolean;
  customCss?: string;
  isActive?: boolean;
  ctaConfig?: CTAConfig; // NEW: CTA configuration
}

/**
 * Create a new embed design for a chatbot
 */
export async function createEmbedDesign(input: CreateEmbedDesignInput) {
  try {
    const embedId = uuidv4();
    
    const result = await db.insert(embedDesigns).values({
      chatbotConfigId: input.chatbotConfigId,
      userId: input.userId,
      embedId,
      name: input.name || `Embed ${new Date().toLocaleDateString()}`,
      description: input.description,
      designType: input.designType || "minimal",
      primaryColor: input.primaryColor || "#2563eb",
      backgroundColor: input.backgroundColor || "#ffffff",
      textColor: input.textColor || "#1f2937",
      welcomeMessage: input.welcomeMessage,
      welcomeType: input.welcomeType || "text",
      inputPlaceholder: input.inputPlaceholder || "Type your message...",
      showAvatar: input.showAvatar ?? true,
      showTimestamp: input.showTimestamp ?? false,
      headerText: input.headerText,
      footerText: input.footerText,
      ctaConfig: input.ctaConfig || null, // NEW: CTA config
      hideBranding: input.hideBranding ?? false,
      customCss: input.customCss,
      isActive: true,
    }).returning();

    // Add default components for this design
    await addDefaultComponents(result[0].id);

    return result[0];
  } catch (error) {
    console.error("Error creating embed design:", error);
    throw error;
  }
}

/**
 * Add default components based on design type
 */
async function addDefaultComponents(embedDesignId: number) {
  const defaultComponents = [
    { name: "welcome_section", visible: true, order: 0 },
    { name: "chat_messages", visible: true, order: 1 },
    { name: "input_field", visible: true, order: 2 },
    { name: "feedback_buttons", visible: false, order: 3 },
    { name: "typing_indicator", visible: true, order: 4 },
  ];

  for (const component of defaultComponents) {
    await db.insert(embedDesignComponents).values({
      embedDesignId,
      componentName: component.name,
      isVisible: component.visible,
      componentOrder: component.order,
    }).catch((err) => console.error(`Error adding component ${component.name}:`, err));
  }
}

/**
 * Get embed design by embedId (public access)
 */
export async function getEmbedDesignByEmbedId(embedId: string) {
  try {
    const design = await db
      .select()
      .from(embedDesigns)
      .where(eq(embedDesigns.embedId, embedId))
      .limit(1);

    if (!design.length) {
      return null;
    }

    // Fetch associated components
    const components = await db
      .select()
      .from(embedDesignComponents)
      .where(eq(embedDesignComponents.embedDesignId, design[0].id))
      .orderBy(embedDesignComponents.componentOrder);

    // Fetch chatbot config
    const chatbot = await db
      .select()
      .from(chatbotConfigs)
      .where(eq(chatbotConfigs.id, design[0].chatbotConfigId))
      .limit(1);

    return {
      ...design[0],
      components: components,
      chatbotConfig: chatbot[0] || null,
    };
  } catch (error) {
    console.error("Error fetching embed design by embedId:", error);
    throw error;
  }
}

/**
 * Get embed design by ID (requires ownership validation)
 */
export async function getEmbedDesignById(id: number, userId: string) {
  try {
    const design = await db
      .select()
      .from(embedDesigns)
      .where(
        and(
          eq(embedDesigns.id, id),
          eq(embedDesigns.userId, userId)
        )
      )
      .limit(1);

    if (!design.length) {
      return null;
    }

    // Fetch associated components
    const components = await db
      .select()
      .from(embedDesignComponents)
      .where(eq(embedDesignComponents.embedDesignId, design[0].id))
      .orderBy(embedDesignComponents.componentOrder);

    return {
      ...design[0],
      components,
    };
  } catch (error) {
    console.error("Error fetching embed design by ID:", error);
    throw error;
  }
}

/**
 * Get all embed designs for a chatbot
 */
export async function getEmbedDesignsByChatbot(chatbotConfigId: number, userId: string) {
  try {
    const designs = await db
      .select()
      .from(embedDesigns)
      .where(
        and(
          eq(embedDesigns.chatbotConfigId, chatbotConfigId),
          eq(embedDesigns.userId, userId)
        )
      )
      .orderBy(embedDesigns.createdAt);

    // Fetch components for each design
    const designsWithComponents = await Promise.all(
      designs.map(async (design) => {
        const components = await db
          .select()
          .from(embedDesignComponents)
          .where(eq(embedDesignComponents.embedDesignId, design.id))
          .orderBy(embedDesignComponents.componentOrder);

        return {
          ...design,
          components,
        };
      })
    );

    return designsWithComponents;
  } catch (error) {
    console.error("Error fetching embed designs for chatbot:", error);
    throw error;
  }
}

/**
 * Update embed design
 */
export async function updateEmbedDesign(id: number, userId: string, input: UpdateEmbedDesignInput) {
  try {
    // Verify ownership
    const existing = await getEmbedDesignById(id, userId);
    if (!existing) {
      throw new Error("Embed design not found or unauthorized");
    }

    const result = await db
      .update(embedDesigns)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(embedDesigns.id, id),
          eq(embedDesigns.userId, userId)
        )
      )
      .returning();

    if (!result.length) {
      throw new Error("Failed to update embed design");
    }

    return result[0];
  } catch (error) {
    console.error("Error updating embed design:", error);
    throw error;
  }
}

/**
 * Delete embed design
 */
export async function deleteEmbedDesign(id: number, userId: string) {
  try {
    // Verify ownership
    const existing = await getEmbedDesignById(id, userId);
    if (!existing) {
      throw new Error("Embed design not found or unauthorized");
    }

    // Delete components first (cascade)
    await db
      .delete(embedDesignComponents)
      .where(eq(embedDesignComponents.embedDesignId, id));

    // Delete design
    const result = await db
      .delete(embedDesigns)
      .where(
        and(
          eq(embedDesigns.id, id),
          eq(embedDesigns.userId, userId)
        )
      )
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error deleting embed design:", error);
    throw error;
  }
}

/**
 * Update component visibility
 */
export async function updateComponentVisibility(
  embedDesignId: number,
  componentName: string,
  isVisible: boolean,
  userId: string
) {
  try {
    // Verify ownership
    const design = await db
      .select()
      .from(embedDesigns)
      .where(
        and(
          eq(embedDesigns.id, embedDesignId),
          eq(embedDesigns.userId, userId)
        )
      )
      .limit(1);

    if (!design.length) {
      throw new Error("Embed design not found or unauthorized");
    }

    // Update or create component
    const existing = await db
      .select()
      .from(embedDesignComponents)
      .where(
        and(
          eq(embedDesignComponents.embedDesignId, embedDesignId),
          eq(embedDesignComponents.componentName, componentName)
        )
      )
      .limit(1);

    if (existing.length) {
      const result = await db
        .update(embedDesignComponents)
        .set({ isVisible })
        .where(eq(embedDesignComponents.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(embedDesignComponents)
        .values({
          embedDesignId,
          componentName,
          isVisible,
          componentOrder: 0,
        })
        .returning();
      return result[0];
    }
  } catch (error) {
    console.error("Error updating component visibility:", error);
    throw error;
  }
}

/**
 * Get embed design with all related data (for rendering)
 */
export async function getEmbedDesignForRendering(embedId: string) {
  try {
    const design = await getEmbedDesignByEmbedId(embedId);
    if (!design || !design.isActive) {
      return null;
    }

    return design;
  } catch (error) {
    console.error("Error fetching embed design for rendering:", error);
    throw error;
  }
}
