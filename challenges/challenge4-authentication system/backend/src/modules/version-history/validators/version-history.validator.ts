import { Injectable } from '@nestjs/common';

@Injectable()
export class VersionHistoryValidator {
  isDuplicateSnapshot(previous: any, next: { title: string; content: any }) {
    return this.normalize(previous.title) === this.normalize(next.title)
      && this.stableStringify(previous.content) === this.stableStringify(next.content);
  }

  shouldAutoCreateVersion(previous: any, next: { title: string; content: any }) {
    if (this.isDuplicateSnapshot(previous, next)) {
      return false;
    }

    const previousText = this.extractText(previous.content);
    const nextText = this.extractText(next.content);
    const delta = Math.abs(nextText.length - previousText.length);
    const ageMs = Date.now() - new Date(previous.createdAt).getTime();
    const isMajorChange = delta >= 400 || Math.max(previousText.length, nextText.length) === 0
      ? delta > 0
      : delta / Math.max(previousText.length, nextText.length) >= 0.2;

    return ageMs >= 5 * 60 * 1000 || isMajorChange;
  }

  private normalize(value: any): string {
    return typeof value === 'string' ? value.trim() : String(value ?? '').trim();
  }

  private stableStringify(value: any): string {
    return JSON.stringify(this.sortValue(value));
  }

  private sortValue(value: any): any {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortValue(item));
    }

    if (value && typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((accumulator: Record<string, any>, key) => {
          accumulator[key] = this.sortValue(value[key]);
          return accumulator;
        }, {});
    }

    return value;
  }

  private extractText(value: any): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.extractText(item)).join(' ');
    }

    if (value.ops && Array.isArray(value.ops)) {
      return value.ops
        .map((op: any) => {
          if (typeof op.insert === 'string') {
            return op.insert;
          }
          if (op.insert && typeof op.insert === 'object') {
            return this.extractText(op.insert);
          }
          return '';
        })
        .join(' ')
        .trim();
    }

    if (value.content && Array.isArray(value.content)) {
      return value.content.map((item: any) => this.extractText(item)).join(' ');
    }

    if (typeof value.text === 'string') {
      return value.text;
    }

    return '';
  }
}