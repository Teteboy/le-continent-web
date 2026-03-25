import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Play, Pause, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface Histoire {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  audio_url: string | null;
}

// Convert raw content to styled HTML
function renderStyledContent(content: string | null): React.ReactNode {
  if (!content) return null;
  
  // Clean up the content
  let text = content.replace(/\|SECTION\|/g, '\n\n');
  text = text.replace(/\*/g, '•');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\n\n+/g, '\n\n');
  
  // Split into paragraphs
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  return paragraphs.map((para, idx) => {
    const trimmed = para.trim();
    if (!trimmed) return null;
    
    // Check if it's a main title (all caps, first paragraph)
    if (idx === 0 && /^[A-Z\sÀÉÈÊËÎÏÔÙÛÜÇ'.-]+$/.test(trimmed) && trimmed.length < 100) {
      return (
        <h2 key={idx} className="text-2xl font-black text-[#2C3E50] mb-6 pb-4 border-b-2 border-[#9B59B6]">
          {trimmed}
        </h2>
      );
    }
    
    // Check if it's a numbered section (like "1. Le protectorat..." or "1\nLe protecteur...")
    const numberMatch = trimmed.match(/^(\d+)[.\n]\s*([A-Z][^.]+(?:\([^)]*\))?)/);
    if (numberMatch) {
      const num = numberMatch[1];
      const sectionTitle = numberMatch[2].trim();
      const restContent = trimmed.slice(numberMatch[0].length).trim();
      
      return (
        <div key={idx} className="mb-6">
          <h3 className="text-lg font-bold text-[#2C3E50] flex items-center gap-2 mb-2">
            <span className="bg-[#9B59B6] text-white text-xs font-bold px-2 py-1 rounded">
              {num}
            </span>
            {sectionTitle}
          </h3>
          {restContent && (
            <p className="text-gray-700 leading-relaxed text-lg text-justify">
              {restContent}
            </p>
          )}
        </div>
      );
    }
    
    // Check if line starts with a bullet
    if (trimmed.startsWith('•')) {
      const items = trimmed.split('•').filter(i => i.trim());
      return (
        <ul key={idx} className="space-y-2 mb-4 ml-4">
          {items.map((item, iIdx) => (
            <li key={iIdx} className="text-gray-700 leading-relaxed text-lg flex items-start gap-2">
              <span className="text-[#9B59B6] mt-1">•</span>
              <span>{item.trim()}</span>
            </li>
          ))}
        </ul>
      );
    }
    
    // Regular paragraph
    return (
      <p key={idx} className="text-gray-700 leading-relaxed text-lg text-justify mb-4">
        {trimmed}
      </p>
    );
  });
}

export default function HistoireDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { playingId, playSound } = useAudioPlayer();
  const [histoire, setHistoire] = useState<Histoire | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  
  let village: { id: string; name: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch { village = null; }

  useEffect(() => {
    async function fetchHistoire() {
      if (!id) {
        setError('Histoire non trouvée');
        setIsLoading(false);
        return;
      }

      try {
        const supabaseUrl = 'https://dltkfjkodqpzmpuctnju.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGtmamtvZHFwem1wdWN0bmp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2ODMyMSwiZXhwIjoyMDc5NzQ0MzIxfQ.Vz6yapqHN7NlI83izQiFGIf2L_8vegNMpl99r_yQxDw';
        
        const response = await fetch(
          `${supabaseUrl}/rest/v1/histoires?id=eq.${id}&select=*`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          setHistoire(data[0]);
        } else {
          setError('Histoire non trouvée');
        }
      } catch {
        setError('Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistoire();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#9B59B6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !histoire) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center p-8">
          <BookOpen size={64} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">{error || 'Histoire non trouvée'}</p>
          <Button 
            onClick={() => navigate(-1)}
            className="bg-[#9B59B6] hover:bg-[#8E44AD] text-white"
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Floating Back Button */}
      <div className="fixed top-20 left-4 z-50">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-[#2C3E50] px-4 py-2 rounded-full shadow-lg hover:bg-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-semibold text-sm">Retour</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative h-72 md:h-80 overflow-hidden">
        {histoire.image_url ? (
          <img src={histoire.image_url} alt={histoire.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
            <BookOpen size={80} className="text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Audio Button */}
        {histoire.audio_url && (
          <button
            onClick={() => playSound(histoire.id, histoire.audio_url!)}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white rounded-full p-3 hover:bg-white/30 transition-colors"
          >
            {playingId === histoire.id ? <Pause size={20} /> : <Play size={20} />}
          </button>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#9B59B6] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Conte & Histoire
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{histoire.title}</h1>
            {village && (
              <p className="text-white/90 font-medium flex items-center gap-2">
                <MapPin size={16} className="text-[#9B59B6]" />
                {village.name.split(' (')[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8">
            {histoire.content ? (
              renderStyledContent(histoire.content)
            ) : (
              <div className="text-center py-8">
                <BookOpen size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Contenu non disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 pb-8">
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full h-12 text-base font-semibold rounded-xl"
          >
            <ArrowLeft size={18} className="mr-2" />
            Retour aux histoires
          </Button>
        </div>
      </div>
    </div>
  );
}
