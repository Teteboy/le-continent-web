import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UtensilsCrossed, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { useAuth } from '@/hooks/useAuth';

interface Met {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

// Parse description into structured format with sections
interface Section {
  title: string;
  items: string[];
}

function parseMetDescription(description: string | null): Section[] {
  if (!description) return [];
  
  // Normalize the text first - replace special chars
  // Clean up the text but keep bullet markers for splitting
  const text = description
    .replace(//g, '|BULLET|')  // Replace special bullets with markers
    .replace(/•/g, '|BULLET|')   // Replace standard bullets with markers
    .replace(//g, '|BULLET|')   // Replace special char with marker
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .trim();
  
  // The data has sections concatenated without proper line breaks
  // Split by section keywords even when they're in the middle of text
  // Look for INGRÉDIENTS and PRÉPARATION patterns
  
  // First, let's split by section keywords
  const sectionSplits = text.split(/(INGRÉDIENTS\s*:|PRÉPARATION\s*:|INGREDIENTS\s*:|PREPARATION\s*:)/gi);
  
  const sections: Section[] = [];
  
  for (let i = 0; i < sectionSplits.length; i++) {
    const part = sectionSplits[i].trim();
    if (!part) continue;
    
    // Check if this part is a section header
    if (/^(INGRÉDIENTS|PRÉPARATION|INGREDIENTS|PREPARATION)\s*:/i.test(part)) {
      const title = part.replace(/\s*:\s*$/, '').toUpperCase();
      // Get the content after this header (next part in array)
      const nextPart = sectionSplits[i + 1]?.trim() || '';
      if (nextPart) {
        // Split by bullet points
        const items = nextPart
          .split('|BULLET|')
          .map(item => item.trim())
          .filter(item => item.length > 0 && item !== '1');
        
        if (items.length > 0) {
          sections.push({ title, items });
        }
      }
    }
  }
  
  // If no sections found with this method, try simpler parsing
  if (sections.length === 0) {
    // Split by newlines and filter
    const lines = text.split(/\n|\r/).map(l => l.trim()).filter(l => l);
    let currentSection: Section | null = null;
    
    for (const line of lines) {
      // Check if this is a section header
      if (/^(INGRÉDIENTS|PRÉPARATION|INGREDIENTS|PREPARATION)\s*:/i.test(line)) {
        if (currentSection && currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { title: line.replace(/\s*:\s*$/, '').toUpperCase(), items: [] };
      } else if (/^\d+$/.test(line)) {
        // Skip standalone numbers
        continue;
      } else if (currentSection) {
        // Add to current section - split by bullets
        const items = line.split('|BULLET|').map(item => item.trim()).filter(item => item.length > 0);
        currentSection.items.push(...items);
      } else {
        currentSection = { title: 'PRÉPARATION', items: [] };
        const items = line.split('|BULLET|').map(item => item.trim()).filter(item => item.length > 0);
        currentSection.items.push(...items);
      }
    }
    
    if (currentSection && currentSection.items.length > 0) {
      sections.push(currentSection);
    }
  }
  
  // Final fallback
  if (sections.length === 0) {
    return [{ title: 'DÉTAILS', items: [text] }];
  }
  
  return sections;
}

export default function MetsDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  // const { profile } = useAuth();
  const [met, setMet] = useState<Met | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  
  let village: { id: string; name: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch { village = null; }

  useEffect(() => {
    async function fetchMet() {
      if (!id) {
        setError('Plat non trouvé');
        setIsLoading(false);
        return;
      }

      try {
        const supabaseUrl = 'https://dltkfjkodqpzmpuctnju.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGtmamtvZHFwem1wdWN0bmp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2ODMyMSwiZXhwIjoyMDc5NzQ0MzIxfQ.Vz6yapqHN7NlI83izQiFGIf2L_8vegNMpl99r_yQxDw';
        
        const response = await fetch(
          `${supabaseUrl}/rest/v1/mets?id=eq.${id}&select=*`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          setMet(data[0]);
        } else {
          setError('Plat non trouvé');
        }
      } catch {
      setError('Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMet();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E67E22] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !met) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center p-8">
          <UtensilsCrossed size={64} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">{error || 'Plat non trouvé'}</p>
          <Button 
            onClick={() => navigate(-1)}
            className="bg-[#E67E22] hover:bg-[#D35400] text-white"
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const sections = parseMetDescription(met.description);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero Section */}
      <div className="relative h-72 md:h-80 overflow-hidden">
        {met.image_url ? (
          <img src={met.image_url} alt={met.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E67E22] via-[#D35400] to-[#BA4A00] flex items-center justify-center">
            <UtensilsCrossed size={80} className="text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#E67E22] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Spécialité Locale
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{met.name}</h1>
            {village && (
              <p className="text-white/90 font-medium flex items-center gap-2">
                <MapPin size={16} className="text-[#E67E22]" />
                {village.name.split(' (')[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        

        {/* Content Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          
          <div className="p-6 md:p-8">
            {sections.map((section, sectionIdx) => (
                <div key={sectionIdx} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-bold text-[#2C3E50] mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-[#E67E22] rounded-full"></span>
                    {section.title}
                  </h3>
                  <div className="space-y-3">
                    {section.items.map((item: string, idx: number) => (
                      <div 
                        key={idx} 
                        className="flex gap-4 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="w-7 h-7 bg-[#E67E22] rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-sm">{idx + 1}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed pt-0.5 flex-1">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
            Retour aux plats
          </Button>
        </div>
      </div>
    </div>
  );
}
