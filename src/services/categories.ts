import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { Category, type ICategory } from "@/models/Category";
import { Product } from "@/models/Product";
import { recordAudit } from "@/services/audit";
import type { CategoryDTO } from "@/types";
import type { categoryInputSchema } from "@/lib/validation/product";
import type { Types } from "mongoose";

type CategoryInput = z.infer<typeof categoryInputSchema>;

type LeanCategory = ICategory & { _id: Types.ObjectId };

function toDTO(category: LeanCategory, productCount?: number): CategoryDTO {
  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    order: category.order,
    active: category.active,
    productCount,
  };
}

export async function listCategoriesWithCounts(): Promise<CategoryDTO[]> {
  await connectDb();
  const [categories, counts] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean<LeanCategory[]>(),
    Product.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(counts.map((row) => [String(row._id), row.count]));
  return categories.map((category) => toDTO(category, countMap.get(String(category._id)) ?? 0));
}

export async function createCategory(
  actor: { id: string; email: string },
  input: CategoryInput,
): Promise<CategoryDTO> {
  await connectDb();
  const base = slugify(input.name) || `category-${Date.now().toString(36)}`;
  let slug = base;
  let attempt = 0;
  while (await Category.exists({ slug })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  const category = await Category.create({
    name: input.name,
    slug,
    description: input.description || undefined,
    image: input.image || undefined,
    order: input.order ?? 0,
    active: input.active ?? true,
  });
  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "category.created",
    targetType: "category",
    targetId: String(category._id),
    metadata: { name: category.name, slug: category.slug },
  });
  return toDTO(category.toObject() as LeanCategory, 0);
}

export async function updateCategory(
  actor: { id: string; email: string },
  categoryId: string,
  input: CategoryInput,
): Promise<CategoryDTO> {
  await connectDb();
  const category = await Category.findById(categoryId);
  if (!category) throw ApiError.notFound("Category not found.");

  const before = {
    name: category.name,
    description: category.description,
    image: category.image,
    order: category.order,
    active: category.active,
  };

  if (input.name !== category.name) {
    const base = slugify(input.name) || category.slug;
    let slug = base;
    let attempt = 0;
    while (await Category.exists({ slug, _id: { $ne: category._id } })) {
      attempt += 1;
      slug = `${base}-${attempt}`;
    }
    category.slug = slug;
  }

  category.name = input.name;
  category.description = input.description || undefined;
  category.image = input.image || undefined;
  category.order = input.order ?? category.order;
  category.active = input.active ?? category.active;
  await category.save();

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "category.updated",
    targetType: "category",
    targetId: String(category._id),
    metadata: {
      before,
      after: {
        name: category.name,
        description: category.description,
        image: category.image,
        order: category.order,
        active: category.active,
      },
    },
  });

  const productCount = await Product.countDocuments({ categoryId: category._id });
  return toDTO(category.toObject() as LeanCategory, productCount);
}

export async function deleteCategory(
  actor: { id: string; email: string },
  categoryId: string,
): Promise<void> {
  await connectDb();
  const category = await Category.findById(categoryId).lean<LeanCategory>();
  if (!category) throw ApiError.notFound("Category not found.");
  const products = await Product.countDocuments({ categoryId: category._id });
  if (products > 0) {
    throw ApiError.conflict(
      `This category contains ${products} listing${products === 1 ? "" : "s"}. Move or delete them first.`,
    );
  }
  await Category.deleteOne({ _id: category._id });
  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "category.deleted",
    targetType: "category",
    targetId: String(category._id),
    metadata: { name: category.name, slug: category.slug },
  });
}
