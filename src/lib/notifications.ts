import { prisma } from "./prisma";
import type { AuditAction } from "@/types";

export async function createNotification(
  userId: string,
  message: string,
  type: string,
  entityType?: string,
  entityId?: string
) {
  try {
    await prisma.notification.create({
      data: { userId, message, type, entityType, entityId },
    });
  } catch (e) {
    console.error("Erreur création notification:", e);
  }
}

export async function notifyAdmins(
  message: string,
  type: string,
  entityType?: string,
  entityId?: string
) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin", statut: true },
      select: { id: true },
    });
    await Promise.all(
      admins.map((a) => createNotification(a.id, message, type, entityType, entityId))
    );
  } catch (e) {
    console.error("Erreur notifyAdmins:", e);
  }
}

export async function createAuditLog(
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId?: string,
  details?: unknown
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : undefined,
      },
    });
  } catch (e) {
    console.error("Erreur audit log:", e);
  }
}
