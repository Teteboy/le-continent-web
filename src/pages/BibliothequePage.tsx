import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ExternalLink, Crown, Lock, Loader2, FileText, ArrowRight, FileDown, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import PaymentModal from '@/components/payment/PaymentModal';

interface CultureBook {
  id: string;
  title: string;
  author?: string;
  description?: string;
  content?: string;
  image_url?: string;
  pdf_url?: string;
  category?: string;
  is_premium?: boolean;
  created_at: string;
}

export default function BibliothequePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;

  const [books, setBooks] = useState<CultureBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<CultureBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const retryCount = useRef(0);

  const fetchBooks = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) setLoading(true);
      setFetchError(null);
      const { data, error: err } = await supabase
        .from('cultures_books')
        .select('*')
        .order('category', { ascending: true })
        .order('created_at', { ascending: false });

      if (err) throw err;
      setBooks(data || []);
      retryCount.current = 0;
    } catch (err) {
      console.error('Error fetching books:', err);
      if (retryCount.current < 2) {
        retryCount.current++;
        setTimeout(() => fetchBooks(true), 1500 * retryCount.current);
        return;
      }
      setFetchError('Impossible de charger la bibliothèque. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount + refetch when tab becomes visible (prevents stale/empty pages)
  useEffect(() => {
    fetchBooks();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchBooks(true); // silent refetch
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchBooks]);

  useEffect(() => {
    if (selectedBookId) {
      fetchBookDetails(selectedBookId);
    }
  }, [selectedBookId]);

  const fetchBookDetails = async (bookId: string) => {
    try {
      setLoadingDetails(true);
      const { data, error: err } = await supabase
        .from('cultures_books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (err) throw err;
      setSelectedBook(data);
    } catch (err) {
      console.error('Error fetching book details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Group books by category
  const booksByCategory = books.reduce((acc, book) => {
    const category = book.category || 'Autres';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(book);
    return acc;
  }, {} as Record<string, CultureBook[]>);

  const categories = Object.keys(booksByCategory).sort();

  // For free users, limit to 3 books per category
  const displayedBooksByCategory = Object.fromEntries(
    Object.entries(booksByCategory).map(([category, categoryBooks]) => [
      category,
      isPremium ? categoryBooks : categoryBooks.slice(0, 3)
    ])
  );

  const hasMoreBooks = (category: string) => {
    if (isPremium) return false;
    return (booksByCategory[category]?.length ?? 0) > 3;
  };

  const handleBookClick = (book: CultureBook) => {
    setSelectedBookId(book.id);
  };

  const handleCloseDetails = () => {
    setSelectedBookId(null);
    setSelectedBook(null);
  };

  const handleUpgrade = () => {
    if (!user) {
      navigate('/inscription');
      return;
    }
    setShowPayment(true);
  };

  // Handle PDF/document opening
  const handleOpenPdf = () => {
    if (!selectedBook?.pdf_url) return;
    window.open(selectedBook.pdf_url, '_blank');
  };

  const handleDownloadPdf = () => {
    if (!selectedBook?.pdf_url) return;
    const link = document.createElement('a');
    link.href = selectedBook.pdf_url;
    link.download = selectedBook.title + '.pdf';
    link.click();
  };

  const handleOpenImage = () => {
    if (!selectedBook?.image_url) return;
    window.open(selectedBook.image_url, '_blank');
  };

  // Show book details view
  if (selectedBookId) {
    if (loadingDetails) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
          <Loader2 size={40} className="text-[#8B0000] animate-spin" />
        </div>
      );
    }

    if (!selectedBook) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Livre non trouvé</p>
            <Button onClick={handleCloseDetails}>Retour</Button>
          </div>
        </div>
      );
    }

    // Determine what document to show
    const hasPdf = !!selectedBook.pdf_url;
    const hasImage = !!selectedBook.image_url;
    const documentUrl = selectedBook.pdf_url || selectedBook.image_url;

    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        {/* Header */}
        <div
          className="relative h-48 bg-cover bg-center"
          style={{ backgroundImage: 'url(/2.jpeg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/70" />
          <div className="relative z-10 h-full flex flex-col px-4 sm:px-6 pt-6 max-w-4xl mx-auto">
            <button
              onClick={handleCloseDetails}
              className="flex items-center gap-2 text-white/80 hover:text-white font-semibold text-sm mb-auto transition-colors"
            >
              <ArrowLeft size={18} /> Retour
            </button>
            <div className="pb-4">
              <h1 className="text-3xl font-black text-white drop-shadow-lg">{selectedBook.title}</h1>
              {selectedBook.category && (
                <p className="text-white/80 mt-1">{selectedBook.category}</p>
              )}
            </div>
          </div>
        </div>

        {/* Book Details */}
        <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {/* Document Preview */}
            {hasPdf ? (
              <div className="mb-6">
                <h3 className="font-bold text-[#2C3E50] mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-[#8B0000]" />
                  Aperçu du document
                </h3>
                <div className="w-full h-96 rounded-xl bg-gray-100 overflow-hidden">
                  <iframe 
                    src={selectedBook.pdf_url} 
                    className="w-full h-full"
                    title={selectedBook.title}
                  />
                </div>
              </div>
            ) : hasImage ? (
              <div className="mb-6">
                <h3 className="font-bold text-[#2C3E50] mb-3 flex items-center gap-2">
                  <ImageIcon size={18} className="text-[#8B0000]" />
                  Aperçu
                </h3>
                <div className="w-full h-64 rounded-xl bg-[#2980B9]/10 flex items-center justify-center mb-4 overflow-hidden">
                  <img src={selectedBook.image_url} alt={selectedBook.title} className="w-full h-full object-contain" />
                </div>
              </div>
            ) : (
              <div className="w-full h-48 rounded-xl bg-[#2980B9]/10 flex items-center justify-center mb-6">
                <BookOpen size={64} className="text-[#2980B9]" />
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
              {selectedBook.is_premium ? (
                <Badge className="bg-[#FFD700] text-[#8B0000]">
                  <Crown size={9} fill="currentColor" /> Premium
                </Badge>
              ) : (
                <Badge className="bg-[#27AE60]/10 text-[#27AE60] border border-[#27AE60]/30">
                  Gratuit
                </Badge>
              )}
              {selectedBook.category && (
                <Badge className="bg-[#2980B9]/10 text-[#2980B9] border-none">
                  {selectedBook.category}
                </Badge>
              )}
              {hasPdf && (
                <Badge className="bg-[#8B0000]/10 text-[#8B0000] border-none">
                  PDF
                </Badge>
              )}
            </div>

            {/* Author */}
            {selectedBook.author && (
              <p className="text-sm text-gray-500 mb-4">
                <span className="font-semibold">Auteur:</span> {selectedBook.author}
              </p>
            )}

            {/* Description */}
            {selectedBook.description && (
              <div className="mb-4">
                <h3 className="font-bold text-[#2C3E50] mb-2">Description</h3>
                <p className="text-gray-600">{selectedBook.description}</p>
              </div>
            )}

            {/* Content */}
            {selectedBook.content && !hasPdf && (
              <div className="mb-6">
                <h3 className="font-bold text-[#2C3E50] mb-2">Contenu</h3>
                <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedBook.content}</p>
                </div>
              </div>
            )}

            {/* Document Actions */}
            {documentUrl && (
              <div className="mb-6">
                <h3 className="font-bold text-[#2C3E50] mb-3">Accéder au document</h3>
                <div className="flex flex-wrap gap-3">
                  {hasPdf && (
                    <>
                      <Button
                        onClick={handleOpenPdf}
                        className="bg-[#2980B9] hover:bg-[#1A6091] text-white font-bold"
                      >
                        <Eye size={16} className="mr-2" /> Voir le PDF
                      </Button>
                      <Button
                        onClick={handleDownloadPdf}
                        variant="outline"
                        className="border-[#2980B9] text-[#2980B9]"
                      >
                        <FileDown size={16} className="mr-2" /> Télécharger
                      </Button>
                    </>
                  )}
                  {hasImage && !hasPdf && (
                    <Button
                      onClick={handleOpenImage}
                      className="bg-[#2980B9] hover:bg-[#1A6091] text-white font-bold"
                    >
                      <ExternalLink size={16} className="mr-2" /> Ouvrir l'image
                    </Button>
                  )}
                  {!hasPdf && !hasImage && selectedBook.content && (
                    <Button
                      onClick={() => {}}
                      className="bg-[#2980B9] hover:bg-[#1A6091] text-white font-bold"
                    >
                      <BookOpen size={16} className="mr-2" /> Lire le contenu
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Premium/Unlock Action */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              {selectedBook.is_premium && !isPremium ? (
                <Button
                  onClick={handleUpgrade}
                  className="flex-1 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold h-12"
                >
                  <Lock size={16} className="mr-2" /> Débloquer (1,000 XAF)
                </Button>
              ) : null}
              
              <Button
                onClick={handleCloseDetails}
                variant="outline"
                className="border-gray-300 h-12"
              >
                Retour
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          open={showPayment}
          onClose={() => setShowPayment(false)}
        />
      </div>
    );
  }

  // Show categories list
  if (loading && books.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 size={40} className="text-[#8B0000] animate-spin" />
      </div>
    );
  }

  if (fetchError && books.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] gap-4 px-6 text-center">
        <AlertCircle size={48} className="text-red-500" />
        <p className="text-gray-600">{fetchError}</p>
        <Button onClick={() => { retryCount.current = 0; fetchBooks(); }} variant="outline" className="flex items-center gap-2">
          <RefreshCw size={16} /> Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div
        className="relative h-56 bg-cover bg-center"
        style={{ backgroundImage: 'url(/2.jpeg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/70" />
        <div className="relative z-10 h-full flex flex-col px-4 sm:px-6 pt-6 max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/cultures-premium')}
            className="flex items-center gap-2 text-white/80 hover:text-white font-semibold text-sm mb-auto transition-colors"
          >
            <ArrowLeft size={18} /> Retour
          </button>
          <div className="pb-6">
            <h1 className="text-4xl font-black text-white drop-shadow-lg">Bibliothèque</h1>
            <p className="text-white/80 mt-1 text-lg">Documents, archives et ressources historiques</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
        {books.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune ressource disponible pour le moment.</p>
            <Link to="/cultures-premium" className="text-[#8B0000] font-semibold hover:underline mt-2 inline-block">
              Retour aux cultures
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={20} className="text-[#2980B9]" />
                  <h2 className="text-xl font-extrabold text-[#2C3E50]">{category}</h2>
                  <Badge className="bg-[#2980B9]/10 text-[#2980B9] border-none">
                    {booksByCategory[category].length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedBooksByCategory[category].map((book) => (
                    <div
                      key={book.id}
                      onClick={() => handleBookClick(book)}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                    >
                      <div className="flex gap-4 p-4">
                        <div className="w-20 h-20 rounded-xl bg-[#2980B9]/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {book.image_url ? (
                            <img src={book.image_url} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen size={28} className="text-[#2980B9]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-[#2C3E50] text-base leading-tight line-clamp-2">{book.title}</h3>
                            {book.is_premium ? (
                              <Badge className="bg-[#FFD700] text-[#8B0000] shrink-0 text-[10px]">
                                <Crown size={9} fill="currentColor" /> Premium
                              </Badge>
                            ) : (
                              <Badge className="bg-[#27AE60]/10 text-[#27AE60] border border-[#27AE60]/30 text-[10px] shrink-0">
                                Gratuit
                              </Badge>
                            )}
                          </div>
                          {book.author && (
                            <p className="text-xs text-gray-500 mt-1">{book.author}</p>
                          )}
                          {book.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{book.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="px-4 pb-3 flex items-center justify-end">
                        <ArrowRight size={16} className="text-[#2980B9]" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Show more button for free users */}
                {hasMoreBooks(category) && (
                  <button
                    onClick={handleUpgrade}
                    className="w-full mt-3 py-3 bg-[#FFD700] hover:bg-yellow-400 text-[#8B0000] font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Crown size={16} />
                    Voir plus de {category}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Premium CTA for free users */}
        {!isPremium && books.length > 0 && (
          <div className="mt-8 bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-2xl p-7 text-center shadow-xl">
            <Crown size={44} className="text-[#FFD700] mx-auto mb-3" fill="currentColor" />
            <h3 className="text-2xl font-extrabold text-white mb-1">
              Accédez au contenu complet
            </h3>
            <p className="text-white/70 text-sm mb-5">
              Passez Premium pour débloquer tous les documents et ressources
            </p>
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="text-white/40 line-through text-base">2 000 FCFA</span>
              <span className="text-3xl font-black text-[#FFD700]">1 000 FCFA</span>
              <Badge className="bg-[#E74C3C] text-white font-bold">-50%</Badge>
            </div>
            <Button
              onClick={handleUpgrade}
              className="bg-[#FFD700] text-[#8B0000] hover:bg-yellow-400 font-extrabold px-8 h-12 rounded-2xl flex items-center gap-2 mx-auto shadow-lg"
            >
              <Lock size={16} /> Passer Premium
            </Button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
      />
    </div>
  );
}

// Helper component for image icon
function ImageIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
