import { memo, useState } from "react";
import { Star } from "lucide-react";
import { RatingMetadata } from "@/types/message-metadata";

interface RatingMessageProps {
  metadata: RatingMetadata;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
}

export const RatingMessage = memo(function RatingMessage({ 
  metadata, 
  onOptionSelect 
}: RatingMessageProps) {
  const minValue = metadata.minValue || 1;
  const maxValue = metadata.maxValue || 5;
  const ratingType = metadata.ratingType || 'stars';
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
    onOptionSelect('rating_submit', { rating }, `${rating}/${maxValue}`);
  };

  if (ratingType === 'stars') {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-1">
          {Array.from({ length: maxValue }, (_, i) => i + minValue).map((rating) => {
            const isActive = hoveredRating ? rating <= hoveredRating : selectedRating ? rating <= selectedRating : false;
            return (
              <button
                key={rating}
                onClick={() => handleRatingSelect(rating)}
                onMouseEnter={() => setHoveredRating(rating)}
                onMouseLeave={() => setHoveredRating(null)}
                className="p-1 transition-colors"
              >
                <Star 
                  className={`w-6 h-6 ${
                    isActive ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
                  }`}
                />
              </button>
            );
          })}
        </div>
        {selectedRating && (
          <p className="text-sm text-muted-foreground">{selectedRating} / {maxValue}</p>
        )}
      </div>
    );
  } else {
    // Number/scale rating
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i).map((rating) => {
            const isSelected = selectedRating === rating;
            return (
              <button
                key={rating}
                onClick={() => handleRatingSelect(rating)}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  isSelected 
                    ? 'bg-primary text-white border-primary' 
                    : 'border-border bg-muted hover:bg-accent text-foreground'
                }`}
              >
                {rating}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{minValue}</span>
          <span>{maxValue}</span>
        </div>
        {selectedRating && (
          <p className="text-sm text-muted-foreground">You rated: {selectedRating} out of {maxValue}</p>
        )}
      </div>
    );
  }
});