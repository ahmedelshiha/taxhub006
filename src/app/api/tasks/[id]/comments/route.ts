import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { respond } from '@/lib/api-response'
import { TaskCommentCreateSchema } from '@/schemas/shared/entities/task'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * GET /api/tasks/[id]/comments
 * Get all comments for a task (paginated)
 */
export const GET = withTenantContext(
  async (request, { user, tenantId }, { params }) => {
    try {
      const taskId = (await params).id
      const { searchParams } = new URL(request.url)

      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')

      // Verify task exists and user has access
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          tenantId,
        },
      })

      if (!task) {
        return respond.notFound('Task not found')
      }

      // Check authorization
      if (!user.isAdmin && task.assigneeId !== user.id) {
        return respond.forbidden('You do not have access to this task')
      }

      // Get comment count
      const total = await prisma.taskComment.count({
        where: {
          taskId,
        },
      })

      // Get comments (only top-level, replies are included)
      const comments = await prisma.taskComment.findMany({
        where: {
          taskId,
          parentId: null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      })

      return respond.ok({
        data: comments,
        meta: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      })
    } catch (error) {
      console.error('Task comments error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true }
)

/**
 * POST /api/tasks/[id]/comments
 * Add a comment to a task
 */
export const POST = withTenantContext(
  async (request, { user, tenantId }, { params }) => {
    try {
      const taskId = (await params).id

      // Verify task exists and user has access
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          tenantId,
        },
      })

      if (!task) {
        return respond.notFound('Task not found')
      }

      // Check authorization
      if (!user.isAdmin && task.assigneeId !== user.id) {
        return respond.forbidden('You do not have access to this task')
      }

      const body = await request.json()
      const input = TaskCommentCreateSchema.parse(body)

      // Verify parent comment exists (if replying)
      if (input.parentId) {
        const parentComment = await prisma.taskComment.findFirst({
          where: {
            id: input.parentId,
            taskId,
          },
        })

        if (!parentComment) {
          return respond.badRequest('Parent comment not found')
        }
      }

      // Create the comment
      const comment = await prisma.taskComment.create({
        data: {
          taskId,
          authorId: user.id,
          content: input.content,
          parentId: input.parentId || null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      })

      return respond.created({ data: comment })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return respond.badRequest('Invalid comment data', error.errors)
      }
      console.error('Task comment creation error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true }
)
