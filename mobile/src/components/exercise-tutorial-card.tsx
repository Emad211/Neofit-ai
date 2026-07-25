import * as React from 'react';
import { Linking, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { AppText, Card, InlineNotice, PrimaryButton } from '@/components/ui';
import { selectCachedExerciseVideo } from '@/db/exercise-video-repository';
import { Exercise } from '@/domain/models';
import { useApp } from '@/providers/app-provider';
import {
  exerciseYouTubeEmbedUrl,
  exerciseYouTubeSearchUrl,
  findExerciseTutorials,
  YouTubeAgentError,
} from '@/services/youtube-video-agent';

function formatDuration(seconds: number) {
  if (seconds <= 0) return '—';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function ExerciseTutorialCard({
  exercise,
  autoLoad = false,
  compact = false,
}: {
  exercise: Exercise;
  autoLoad?: boolean;
  compact?: boolean;
}) {
  const { locale, hasYouTubeKey } = useApp();
  const [loading, setLoading] = React.useState(false);
  const [cacheKey, setCacheKey] = React.useState<string | null>(null);
  const [videos, setVideos] = React.useState<Awaited<ReturnType<typeof findExerciseTutorials>>['videos']>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [showPlayer, setShowPlayer] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const requestedRef = React.useRef(false);
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);

  const load = React.useCallback(async (forceRefresh = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await findExerciseTutorials({ exercise, locale, forceRefresh });
      setCacheKey(result.cacheKey);
      setVideos(result.videos);
      setSelectedIndex(result.selectedIndex);
      setShowPlayer(false);
    } catch (caught) {
      console.error('Exercise tutorial lookup failed:', caught);
      if (caught instanceof YouTubeAgentError) {
        if (caught.code === 'MISSING_API_KEY') {
          setError(label(
            'Add a personal YouTube Data API key in settings to search and embed tutorials.',
            'برای جست‌وجو و نمایش ویدئوهای آموزشی، کلید شخصی YouTube Data API را در تنظیمات وارد کنید.',
          ));
        } else if (caught.code === 'QUOTA') {
          setError(label('The YouTube API quota is exhausted. Cached videos remain available.', 'سهمیه YouTube API تمام شده است؛ ویدئوهای کش‌شده همچنان در دسترس‌اند.'));
        } else if (caught.code === 'NO_RESULTS') {
          setError(label('No suitable embeddable tutorial was found for this exercise.', 'ویدئوی آموزشی قابل‌نمایش و مناسبی برای این حرکت پیدا نشد.'));
        } else {
          setError(caught.message);
        }
      } else {
        setError(caught instanceof Error ? caught.message : label('Video lookup failed.', 'جست‌وجوی ویدئو انجام نشد.'));
      }
    } finally {
      setLoading(false);
    }
  }, [exercise, label, loading, locale]);

  React.useEffect(() => {
    if (!autoLoad || requestedRef.current) return;
    requestedRef.current = true;
    void load(false);
  }, [autoLoad, load]);

  const select = async (nextIndex: number) => {
    if (videos.length === 0) return;
    const normalized = (nextIndex + videos.length) % videos.length;
    setSelectedIndex(normalized);
    setShowPlayer(false);
    if (cacheKey) await selectCachedExerciseVideo(cacheKey, normalized).catch(() => undefined);
  };

  const current = videos[selectedIndex];
  const openSearch = () => Linking.openURL(exerciseYouTubeSearchUrl(exercise, locale));
  const openVideo = () => current
    ? Linking.openURL(`https://www.youtube.com/watch?v=${encodeURIComponent(current.videoId)}`)
    : openSearch();

  if (!current) {
    return (
      <View style={{ gap: 8 }}>
        {error ? <InlineNotice tone="warning">{error}</InlineNotice> : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={hasYouTubeKey
                ? label('Find form tutorial', 'پیداکردن آموزش فرم حرکت')
                : label('Configure YouTube', 'تنظیم YouTube')}
              variant="secondary"
              onPress={hasYouTubeKey ? () => load(false) : () => router.push('/ai-settings')}
              loading={loading}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton title={label('Open YouTube search', 'بازکردن جست‌وجوی YouTube')} variant="ghost" onPress={openSearch} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Card style={{ padding: compact ? 12 : 16, gap: 10 }}>
      <View style={{ gap: 3 }}>
        <AppText size={compact ? 15 : 17} weight="800">{label('Exercise tutorial', 'ویدئوی آموزشی حرکت')}</AppText>
        <AppText muted size={12}>{label('Selected automatically from embeddable YouTube results; verify that the demonstrated variation matches your plan.', 'این نتیجه به‌صورت خودکار از ویدئوهای قابل‌نمایش YouTube انتخاب شده است؛ مطمئن شوید نوع حرکت با برنامه شما یکسان است.')}</AppText>
      </View>

      {showPlayer ? (
        <View style={{ width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', borderRadius: 16, borderCurve: 'continuous', backgroundColor: '#000000' }}>
          <WebView
            source={{ uri: exerciseYouTubeEmbedUrl(current.videoId) }}
            style={{ flex: 1, backgroundColor: '#000000' }}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction
            javaScriptEnabled
            domStorageEnabled={false}
            sharedCookiesEnabled={false}
            thirdPartyCookiesEnabled={false}
            originWhitelist={['https://www.youtube-nocookie.com', 'https://www.youtube.com']}
            onError={() => setError(label('The embedded player could not load this video. Open it in YouTube instead.', 'پخش‌کننده داخلی این ویدئو را بارگذاری نکرد؛ آن را در YouTube باز کنید.'))}
          />
        </View>
      ) : (
        <View style={{ width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', borderRadius: 16, borderCurve: 'continuous', backgroundColor: '#111827' }}>
          <Image
            source={{ uri: current.thumbnailUrl }}
            contentFit="cover"
            transition={180}
            style={{ width: '100%', height: '100%' }}
            accessibilityLabel={current.title}
          />
        </View>
      )}

      <View style={{ gap: 3 }}>
        <AppText weight="700" size={compact ? 14 : 16}>{current.title}</AppText>
        <AppText muted size={12}>{current.channelTitle} · {formatDuration(current.durationSeconds)}</AppText>
      </View>

      {error ? <InlineNotice tone="warning">{error}</InlineNotice> : null}

      <View style={{ gap: 8 }}>
        <PrimaryButton
          title={showPlayer ? label('Hide player', 'بستن پخش‌کننده') : label('Play here', 'پخش در همین صفحه')}
          onPress={() => setShowPlayer((value) => !value)}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><PrimaryButton title={label('Next result', 'نتیجه بعدی')} variant="secondary" onPress={() => select(selectedIndex + 1)} disabled={videos.length < 2} /></View>
          <View style={{ flex: 1 }}><PrimaryButton title={label('Open in YouTube', 'بازکردن در YouTube')} variant="ghost" onPress={openVideo} /></View>
        </View>
        <PrimaryButton title={label('Refresh search', 'جست‌وجوی دوباره')} variant="ghost" onPress={() => load(true)} loading={loading} />
      </View>
    </Card>
  );
}
