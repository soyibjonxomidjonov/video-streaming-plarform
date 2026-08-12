import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { FrontendState } from '@/types';
import { moviesService } from '@/services/movies.service';
import { seriesService } from '@/services/series.service';
import { commentsService, favoritesService, ratingsService, watchProgressService } from '@/services/interactions.service';
import { useAuthStore } from '@/store/auth.store';

export async function handleApiAction(
  tool: string,
  params: Record<string, any>,
  router: AppRouterInstance,
  pathname: string,
  frontendState: FrontendState
): Promise<boolean> {
  const { isAuthenticated, user } = useAuthStore.getState();

  // Helper to resolve an ID from title or current state
  async function resolveContentId(title?: string): Promise<{ id: number, type: 'movie' | 'series' } | null> {
    if (!title) {
      if (frontendState.content_id && (frontendState.content_type === 'movie' || frontendState.content_type === 'series')) {
        return { id: frontendState.content_id, type: frontendState.content_type };
      }
      return null;
    }
    // Try to search by title
    try {
      const mRes = await moviesService.getMovies({ search: title, limit: 1 });
      if (mRes.results.length > 0) return { id: mRes.results[0].id, type: 'movie' };
      
      const sRes = await seriesService.getSeries({ search: title, limit: 1 });
      if (sRes.results.length > 0) return { id: sRes.results[0].id, type: 'series' };
    } catch (e) {
      console.error(e);
    }
    return null;
  }

  try {
    switch (tool) {
      // ─── SEARCH & DISCOVERY ───
      case 'search_content':
        if (params.query) {
          router.push(`/search?q=${encodeURIComponent(params.query)}`);
        } else {
          router.push('/search');
        }
        return true;
      case 'filter_by_genre':
        router.push(`/search?q=${encodeURIComponent(params.genre || '')}`);
        return true;
      case 'show_trending':
        router.push('/movies?sort=trending');
        return true;
      case 'show_new_releases':
        router.push('/movies?sort=new');
        return true;
      case 'get_recommendations':
        router.push('/movies?sort=trending');
        return true;
      case 'sort_content':
        if (pathname.includes('/movies')) {
           router.push(`/movies?sort=${params.criteria || 'new'}`);
        } else if (pathname.includes('/search')) {
           router.push(`/search?sort=${params.criteria || 'new'}`);
        } else {
           router.push(`/movies?sort=${params.criteria || 'new'}`);
        }
        return true;

      // ─── CONTENT PAGES ───
      case 'open_content':
      case 'show_content_details': {
        const target = await resolveContentId(params.title);
        if (target) {
          router.push(`/${target.type === 'movie' ? 'movies' : 'series'}/${target.id}`);
          return true;
        }
        return false;
      }
      case 'list_episodes': {
        const target = await resolveContentId(params.series_title);
        if (target && target.type === 'series') {
          router.push(`/series/${target.id}`);
          return true;
        } else if (frontendState.content_type === 'series' && frontendState.content_id) {
          router.push(`/series/${frontendState.content_id}`);
          return true;
        }
        return false;
      }

      // ─── FAVORITES ───
      case 'add_to_favorites': {
        if (!isAuthenticated) return false;
        const target = await resolveContentId(params.title);
        if (target) {
          if (target.type === 'movie') await favoritesService.addMovieFavorite(target.id, (user as any).id ?? 0);
          else await favoritesService.addSeriesFavorite(target.id, (user as any).id ?? 0);
          return true;
        }
        return false;
      }
      case 'remove_from_favorites': {
        if (!isAuthenticated) return false;
        const target = await resolveContentId(params.title);
        if (target) {
           if (target.type === 'movie') {
              const res = await favoritesService.getMovieFavorites({ movie: target.id });
              if (res.results.length > 0) await favoritesService.removeMovieFavorite(res.results[0].id);
           } else {
              const res = await favoritesService.getSeriesFavorites({ series: target.id });
              if (res.results.length > 0) await favoritesService.removeSeriesFavorite(res.results[0].id);
           }
           return true;
        }
        return false;
      }
      case 'show_favorites':
        router.push('/profile'); 
        return true;

      // ─── WATCH PROGRESS ───
      case 'resume_watching':
        if (isAuthenticated) {
           const [mRes, eRes] = await Promise.all([
              watchProgressService.getMovieProgress({ limit: 1, ordering: '-updated_at' }),
              watchProgressService.getEpisodeProgress({ limit: 1, ordering: '-updated_at' })
           ]);
           const m = mRes.results[0];
           const e = eRes.results[0];
           if (m && (!e || new Date(m.updated_at) > new Date(e.updated_at))) {
              router.push(`/movies/${m.movie}`);
              return true;
           } else if (e) {
              console.warn("BACKEND_CAPABILITY_MISSING: Episode resume routing logic missing");
              // Fallback
           }
        }
        return false;
      case 'show_continue_watching':
      case 'show_watch_history':
        router.push('/profile');
        return true;
      case 'clear_watch_history':
        console.warn("BACKEND_CAPABILITY_MISSING: no clear history endpoint");
        return false;
      case 'mark_as_watched':
        console.warn("BACKEND_CAPABILITY_MISSING: no mark as watched explicitly, only progress");
        return false;
      case 'remove_from_continue_watching':
        console.warn("BACKEND_CAPABILITY_MISSING: no remove progress endpoint");
        return false;

      // ─── RATINGS & COMMENTS ───
      case 'rate_content': {
        if (!isAuthenticated || !params.stars) return false;
        const target = await resolveContentId(params.title);
        if (target) {
          if (target.type === 'movie') await ratingsService.rateMovie(target.id, (user as any).id ?? 0, params.stars as number);
          else await ratingsService.rateSeries(target.id, (user as any).id ?? 0, params.stars as number);
          return true;
        }
        return false;
      }
      case 'add_comment': {
        if (!isAuthenticated || !params.text) return false;
        const target = await resolveContentId(params.title);
        if (target) {
          if (target.type === 'movie') await commentsService.addMovieComment(target.id, (user as any).id ?? 0, params.text as string);
          else await commentsService.addSeriesComment(target.id, (user as any).id ?? 0, params.text as string);
          if (pathname.includes(`/${target.type === 'movie' ? 'movies' : 'series'}/${target.id}`)) {
            window.location.reload();
          }
          return true;
        }
        return false;
      }
      case 'show_comments': {
        const target = await resolveContentId(params.title);
        if (target) {
          router.push(`/${target.type === 'movie' ? 'movies' : 'series'}/${target.id}#comments`);
          return true;
        }
        return false;
      }
      case 'delete_comment':
        if (params.comment_id) {
           if (frontendState.content_type === 'movie') await commentsService.deleteMovieComment(params.comment_id as number);
           else if (frontendState.content_type === 'series') await commentsService.deleteSeriesComment(params.comment_id as number);
           window.location.reload();
           return true;
        }
        return false;

      // ─── OTHER ───
      case 'share_content': {
        const target = await resolveContentId(params.title);
        if (target) {
          const url = `${window.location.origin}/${target.type === 'movie' ? 'movies' : 'series'}/${target.id}`;
          if (navigator.share) await navigator.share({ url });
          else await navigator.clipboard.writeText(url);
          return true;
        }
        return false;
      }
      case 'report_problem':
        console.warn("BACKEND_CAPABILITY_MISSING: report problem endpoint");
        return false;
      case 'check_login_status':
        return true;
      case 'logout':
        useAuthStore.getState().logout();
        router.push('/login');
        return true;

      default:
        return false;
    }
  } catch (error) {
    console.error(`Error executing action ${tool}:`, error);
    return false;
  }
}
