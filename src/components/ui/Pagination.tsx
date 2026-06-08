import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  siblingCount?: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, siblingCount = 1 }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-800/80 bg-zinc-950/30">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
        >
          Anterior
        </Button>
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
        >
          Próxima
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          {totalItems !== undefined && itemsPerPage !== undefined && (
            <p className="text-sm text-zinc-400">
              Mostrando <span className="font-medium text-zinc-100">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> até <span className="font-medium text-zinc-100">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de{' '}
              <span className="font-medium text-zinc-100">{totalItems}</span> resultados
            </p>
          )}
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="sr-only">Anterior</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              if (
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - siblingCount && page <= currentPage + siblingCount)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold border focus:z-20 transition-colors ${
                      currentPage === page
                        ? 'z-10 bg-zinc-800 border-amber-500/50 text-amber-500'
                        : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - siblingCount - 1 ||
                page === currentPage + siblingCount + 1
              ) {
                return <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-zinc-500 border border-zinc-800">...</span>;
              }
              return null;
            })}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="sr-only">Próxima</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
