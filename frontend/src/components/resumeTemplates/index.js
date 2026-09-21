/**
 * Template registry — maps templateId to the React component.
 * Import `TEMPLATE_MAP` to dynamically render any template by ID.
 * Import individual `PreviewThumbnail` exports for the gallery.
 */

import TemplateModernATS,        { PreviewThumbnail as ThumbModernATS }       from './TemplateModernATS';
import TemplateProfessional,     { PreviewThumbnail as ThumbProfessional }    from './TemplateProfessional';
import TemplateSoftwareEngineer, { PreviewThumbnail as ThumbSoftwareEngineer } from './TemplateSoftwareEngineer';
import TemplateStudentFresher,   { PreviewThumbnail as ThumbStudentFresher }  from './TemplateStudentFresher';
import TemplateMinimal,          { PreviewThumbnail as ThumbMinimal }         from './TemplateMinimal';
import TemplateExecutive,        { PreviewThumbnail as ThumbExecutive }       from './TemplateExecutive';
import Template2Column,          { PreviewThumbnail as Thumb2Column }         from './Template2Column';

export const TEMPLATE_MAP = {
  'modern-ats':       TemplateModernATS,
  'professional':     TemplateProfessional,
  'software-engineer': TemplateSoftwareEngineer,
  'student-fresher':  TemplateStudentFresher,
  'minimal':          TemplateMinimal,
  'executive':        TemplateExecutive,
  '2-column':         Template2Column,
};

export const THUMBNAIL_MAP = {
  'modern-ats':       ThumbModernATS,
  'professional':     ThumbProfessional,
  'software-engineer': ThumbSoftwareEngineer,
  'student-fresher':  ThumbStudentFresher,
  'minimal':          ThumbMinimal,
  'executive':        ThumbExecutive,
  '2-column':         Thumb2Column,
};
