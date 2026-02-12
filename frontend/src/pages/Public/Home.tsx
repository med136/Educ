import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpenIcon,
  SparklesIcon,
  ArrowRightIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  FireIcon,
  HeartIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import api from '../../services/api'
import { useTranslation } from 'react-i18next'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  coverImage: string | null
  readingTime: number
  createdAt: string
  author: {
    firstName: string
    lastName: string
  }
  category: {
    id: string
    name: string
    slug: string
  }
  tags: Array<{
    tag: {
      id: string
      name: string
    }
  }>
  _count: {
    comments: number
  }
}

interface Category {
  id: string
  name: string
  slug: string
  _count?: {
    articles: number
  }
}

interface Tag {
  id: string
  name: string
  slug: string
  _count?: {
    articles: number
  }
}

type ViewMode = 'grid' | 'list'
type SortBy = 'recent' | 'popular' | 'trending'

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtres et recherche
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('recent')
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
    // Charger les favoris depuis localStorage
    const savedFavorites = localStorage.getItem('articleFavorites')
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  const loadData = async () => {
    try {
      const [articlesRes, categoriesRes, tagsRes] = await Promise.all([
        api.get('/articles?status=PUBLISHED&limit=12'),
        api.get('/article-meta/categories'),
        api.get('/article-meta/tags'),
      ])
      const articles = articlesRes.data.articles || articlesRes.data.data || []
      setFeaturedArticles(articles.slice(0, 3))
      setAllArticles(articles)
      setCategories(categoriesRes.data?.data || categoriesRes.data || [])
      setTags(tagsRes.data?.data || tagsRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les articles
  const filteredArticles = useMemo(() => {
    let result = [...allArticles]

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.excerpt?.toLowerCase().includes(query) ||
          article.author.firstName.toLowerCase().includes(query) ||
          article.author.lastName.toLowerCase().includes(query)
      )
    }

    // Filtre par catégorie
    if (selectedCategory) {
      result = result.filter((article) => article.category?.id === selectedCategory)
    }

    // Filtre par tags
    if (selectedTags.length > 0) {
      result = result.filter((article) =>
        article.tags.some((t) => selectedTags.includes(t.tag.id))
      )
    }

    // Tri
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => (b._count?.comments || 0) - (a._count?.comments || 0))
        break
      case 'trending':
        result.sort((a, b) => b.readingTime - a.readingTime)
        break
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  }, [allArticles, searchQuery, selectedCategory, selectedTags, sortBy])

  const toggleFavorite = (articleId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(articleId)) {
        newFavorites.delete(articleId)
      } else {
        newFavorites.add(articleId)
      }
      localStorage.setItem('articleFavorites', JSON.stringify([...newFavorites]))
      return newFavorites
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setSelectedTags([])
    setSortBy('recent')
  }

  const hasActiveFilters = searchQuery || selectedCategory || selectedTags.length > 0 || sortBy !== 'recent'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Featured Articles Spotlight */}
      <section className="py-16 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-700" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-4">
              <FireIcon className="w-4 h-4 text-orange-400" />
              {t('home.featured_articles')}
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              {t('home.featured_articles')}
            </h2>
            <p className="text-xl text-white/70">
              {t('home.featured_articles_desc')}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[220px]">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`relative rounded-2xl overflow-hidden bg-white/10 ring-1 ring-white/10 shadow-lg animate-pulse ${
                    i === 0 ? 'md:col-span-2 md:row-span-2' : ''
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10" />
                  <div className="absolute inset-x-0 bottom-0 p-6 space-y-3">
                    <div className="h-4 bg-white/10 rounded w-1/4" />
                    <div className="h-7 bg-white/10 rounded w-4/5" />
                    {i === 0 && <div className="h-4 bg-white/10 rounded w-3/5" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[220px]">
              {featuredArticles.slice(0, 3).map((article, index) => (
                <Link
                  key={article.id}
                  to={`/articles/${article.slug}`}
                  className={`group relative overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 hover:-translate-y-1 hover:bg-white/15 hover:shadow-2xl ${
                    index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                  }`}
                >
                  <div className="absolute inset-0">
                    {article.coverImage ? (
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <BookOpenIcon className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                    <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      {index === 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          <StarIconSolid className="h-4 w-4" />
                          {t('home.top_article')}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {article.category?.name || t('article.default')}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3
                        className={`font-semibold tracking-tight text-white transition-colors group-hover:text-white ${
                          index === 0 ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
                        }`}
                      >
                        {article.title}
                      </h3>
                      {index === 0 && (
                        <p className="text-sm sm:text-base text-white/80 leading-relaxed line-clamp-3 max-w-2xl">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Articles Section with Filters */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('home.browse_title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('home.browse_desc')}
            </p>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            {/* Search Input */}
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('home.search_placeholder', 'Rechercher un article, un auteur...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex gap-3 items-center">
                {/* Toggle Filters */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    showFilters
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <FunnelIcon className="w-5 h-5" />
                  {t('home.filters')}
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </button>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <ListBulletIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="appearance-none px-4 py-3 pr-10 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="recent">{t('home.sort_recent')}</option>
                    <option value="popular">{t('home.sort_popular')}</option>
                    <option value="trending">{t('home.sort_trending')}</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6 animate-in slide-in-from-top-2 duration-200">
                {/* Categories */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <BookOpenIcon className="w-4 h-4" />
                    {t('home.categories')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        !selectedCategory
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {t('home.all')}
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedCategory === category.id
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {category.name}
                        {category._count?.articles && (
                          <span className="ml-1 text-xs opacity-70">({category._count.articles})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <TagIcon className="w-4 h-4" />
                    {t('home.tags')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 15).map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() =>
                          setSelectedTags((prev) =>
                            prev.includes(tag.id)
                              ? prev.filter((t) => t !== tag.id)
                              : [...prev, tag.id]
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                          selectedTags.includes(tag.id)
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <TagIcon className="w-3 h-3" />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    {t('home.clear_filters')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredArticles.length === 1
                ? t('home.results_single')
                : t('home.results_multiple', { count: filteredArticles.length })}
              {hasActiveFilters && ` ${t('home.search_results')}`}
            </p>
          </div>

          {/* Articles Grid/List */}
          {loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-4'}>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg animate-pulse"
                >
                  <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
              <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('home.no_articles_found')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('home.no_articles_desc')}
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                {t('home.reset_filters')}
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <Link to={`/articles/${article.slug}`} className="block">
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
                      {article.coverImage ? (
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpenIcon className="w-16 h-16 text-white opacity-50" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-900 dark:text-white text-sm font-medium rounded-full">
                          {article.category?.name || t('article.default')}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          toggleFavorite(article.id)
                        }}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:scale-110 transition-transform"
                      >
                        {favorites.has(article.id) ? (
                          <HeartIconSolid className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        )}
                      </button>
                    </div>
                  </Link>

                  <div className="p-6">
                    <Link to={`/articles/${article.slug}`}>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {article.excerpt}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {article.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md"
                        >
                          <TagIcon className="w-3 h-3" />
                          {tag.tag.name}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {article.author.firstName[0]}
                          {article.author.lastName[0]}
                        </div>
                        <span>
                          {article.author.firstName} {article.author.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {article.readingTime} min
                        </span>
                        <span className="flex items-center gap-1">
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          {article._count?.comments || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row"
                >
                  <Link to={`/articles/${article.slug}`} className="md:w-72 flex-shrink-0">
                    <div className="relative h-48 md:h-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
                      {article.coverImage ? (
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpenIcon className="w-16 h-16 text-white opacity-50" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                          {article.category?.name || t('article.default')}
                        </span>
                        <button
                          onClick={() => toggleFavorite(article.id)}
                          className="ml-auto p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {favorites.has(article.id) ? (
                            <HeartIconSolid className="w-5 h-5 text-red-500" />
                          ) : (
                            <HeartIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <Link to={`/articles/${article.slug}`}>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {article.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {article.tags.slice(0, 5).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md"
                          >
                            <TagIcon className="w-3 h-3" />
                            {tag.tag.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {article.author.firstName[0]}
                          {article.author.lastName[0]}
                        </div>
                        <span>
                          {article.author.firstName} {article.author.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {article.readingTime} min
                        </span>
                        <span className="flex items-center gap-1">
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          {article._count?.comments || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700"
            >
              {t('home.view_all_articles')}
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="pour-qui" className="py-24 bg-white dark:bg-gray-900 overflow-hidden scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              {t('home.testimonials')}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('home.testimonials_title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('home.testimonials_desc')}
            </p>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                key: '1',
                avatar: 'SM',
                rating: 5,
                gradient: 'from-pink-500 to-rose-500',
              },
              {
                key: '2',
                avatar: 'TD',
                rating: 5,
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                key: '3',
                avatar: 'ML',
                rating: 5,
                gradient: 'from-amber-500 to-orange-500',
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 relative"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full" />
                
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{t(`home.testimonials_list.${testimonial.key}.name`)}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t(`home.testimonials_list.${testimonial.key}.role`)}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
                  "{t(`home.testimonials_list.${testimonial.key}.content`) }"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-slate-100 to-blue-100 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
                <SparklesIcon className="w-4 h-4" />
                {t('home.newsletter')}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t('home.newsletter_title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
                {t('home.newsletter_desc')}
              </p>
              
              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder={t('home.newsletter_placeholder')}
                  className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap"
                >
                  {t('home.newsletter_subscribe')}
                </button>
              </form>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                {t('home.newsletter_note')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            {t('home.cta_title')}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {t('home.cta_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {t('home.cta_create_account')}
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
