import { useArticles } from "@/hooks/use-articles";
import { Badge } from "@/components/ui/Badge";
import { Calendar, Eye } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Link } from "wouter";

export default function Magazine() {
  const { data: articles, isLoading } = useArticles();

  if (isLoading) return <div className="text-center py-20 text-primary animate-pulse">Ładowanie magazynu...</div>;

  return (
    <div className="space-y-8">
      <div className="relative rounded-3xl overflow-hidden aspect-[21/9] bg-card border border-border group">
        {/* Featured Article Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
        {/* scenic stock image */}
        <img 
          src="https://pixabay.com/get/ga7bec7c84f4fcea143bfe99f529c7d7e2e873ed6adbedc7fbec024515661a32712a543164e6abaf0bcc59e1cac15d093f52d22242651c2262a842b0b6b9ef73a_1280.jpg" 
          alt="Featured" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute bottom-0 left-0 p-6 md:p-10 z-20 max-w-2xl space-y-4">
          <Badge className="bg-primary text-black">Temat Tygodnia</Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            Przyszłość społeczności LGBTQ+ w cyfrowym świecie
          </h1>
          <p className="text-gray-300 line-clamp-2 md:text-lg">
            Jak technologia zmienia sposób, w jaki budujemy relacje, organizujemy się i walczymy o równe prawa.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles?.map((article) => (
          <Link key={article.id} href={`/magazyn/${article.slug}`} className="group flex flex-col gap-4">
            <div className="aspect-video rounded-2xl bg-card overflow-hidden border border-border group-hover:border-primary/50 transition-colors relative">
               {article.coverImage ? (
                 <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               ) : (
                 <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">Brak zdjęcia</div>
               )}
               <Badge variant="secondary" className="absolute top-3 left-3 backdrop-blur-md bg-black/50 text-white border border-white/10">
                 {article.categorySlug}
               </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {article.publishDate && format(new Date(article.publishDate), "d MMM yyyy", { locale: pl })}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {article.views}
                </span>
              </div>
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-muted-foreground text-sm line-clamp-3">
                {article.excerpt || article.content.substring(0, 100)}...
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
