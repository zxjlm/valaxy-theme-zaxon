<script setup lang="ts">
import { isCategoryList, useCategories } from 'valaxy'

const categories = useCategories()
</script>

<template>
  <Layout>
    <div class="field-catalog">
      <div class="field-catalog__header">
        <p class="field-kicker">
          Field Catalog
        </p>
        <h1 class="field-catalog__title">
          分类
        </h1>
        <p class="field-catalog__count">
          共计 {{ categories.children.size }} 个分类
        </p>
      </div>

      <ul class="field-category-list">
        <template v-for="[name, cat] in categories.children" :key="name">
          <li v-if="isCategoryList(cat)" class="field-category-item">
            <RouterLink :to="`/categories/${name}/`" class="field-category-item__link">
              <span class="field-category-item__name">{{ name }}</span>
              <span class="field-category-item__count">{{ cat.total }}</span>
            </RouterLink>
            <ul
              v-if="[...cat.children.values()].some(c => isCategoryList(c))"
              class="field-category-list field-category-list--nested"
            >
              <template v-for="[subName, subCat] in cat.children" :key="subName">
                <li v-if="isCategoryList(subCat)" class="field-category-item field-category-item--sub">
                  <RouterLink :to="`/categories/${subName}/`" class="field-category-item__link">
                    <span class="field-category-item__name">{{ subName }}</span>
                    <span class="field-category-item__count">{{ subCat.total }}</span>
                  </RouterLink>
                </li>
              </template>
            </ul>
          </li>
        </template>
      </ul>
    </div>
  </Layout>
</template>
