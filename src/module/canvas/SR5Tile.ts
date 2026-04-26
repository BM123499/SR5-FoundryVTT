import { isDocumentVisibleForViewer } from '@/module/perception/perceptionState';

export class SR5Tile extends foundry.canvas.placeables.Tile {
    override get isVisible(): boolean {
        if (!super.isVisible) return false;
        return isDocumentVisibleForViewer(this.document);
    }
}
