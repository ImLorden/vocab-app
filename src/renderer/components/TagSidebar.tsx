import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Globe, Tag, BookOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { useVocabStore } from '../stores/vocab-store';
import { cn } from '../utils/cn';
import { buildTimelineTree, TimelineNode } from '../utils/timeline-tree';

const TagSidebar: React.FC = () => {
  const { 
    tags, 
    selectedTag, 
    setSelectedTag, 
    loadWords, 
    loadWordsByTag,
    toggleExpandedNode,
    isNodeExpanded 
  } = useVocabStore();

  const handleTagClick = async (tagName: string) => {
    if (selectedTag === tagName) {
      setSelectedTag(null);
      await loadWords();
    } else {
      setSelectedTag(tagName);
      await loadWordsByTag(tagName);
    }
  };

  const timelineTree = buildTimelineTree(tags);
  const languageTags = tags.filter(tag => tag.type === 'auto_language');
  const customTags = tags.filter(tag => tag.type === 'custom');

  // Debug info
  console.log('TagSidebar Debug - Total tags:', tags.length);
  console.log('TagSidebar Debug - Tag types:', tags.map(t => ({ name: t.name, type: t.type })));
  console.log('TagSidebar Debug - Language tags:', languageTags.length, languageTags);
  console.log('TagSidebar Debug - Custom tags:', customTags.length, customTags);
  console.log('TagSidebar Debug - Timeline years:', timelineTree.years.length, timelineTree.years);
  console.log('TagSidebar Debug - All tags:', tags);

  const renderTimelineNode = (node: TimelineNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = isNodeExpanded(node.id);
    const paddingLeft = 16 + depth * 16;

    return (
      <div key={node.id}>
        <motion.button
          className={cn(
            'w-full text-left p-2 rounded-md transition-all duration-200 flex items-center justify-between text-sm',
            selectedTag === node.tagName
              ? 'bg-blue-500 text-white shadow-sm'
              : 'hover:bg-white/50 text-gray-600 dark:hover:bg-gray-700/50 dark:text-gray-300'
          )}
          style={{ paddingLeft }}
          onClick={() => handleTagClick(node.tagName)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-2">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpandedNode(node.id);
                }}
                className="hover:bg-black/10 rounded p-0.5"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}
            <span>{node.label}</span>
          </div>
          <span className="text-xs opacity-70">{node.count}</span>
        </motion.button>
        
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children!.map(child => renderTimelineNode(child, depth + 1))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* All Words */}
        <motion.button
          className={cn(
            'w-full text-left p-3 rounded-lg mb-4 transition-all duration-200',
            'flex items-center space-x-2 font-medium',
            selectedTag === null
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white/50 hover:bg-white/70 text-gray-700 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 dark:text-gray-200'
          )}
          onClick={() => handleTagClick('')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <BookOpen className="w-4 h-4" />
          <span>全部单词</span>
        </motion.button>

        {/* Language Directory */}
        {languageTags.length > 0 && (
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <motion.button
              className="w-full text-left p-3 rounded-lg mb-2 bg-white/30 hover:bg-white/50 dark:bg-gray-700/30 dark:hover:bg-gray-700/50 transition-colors duration-200"
              onClick={() => toggleExpandedNode('languages')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2 font-medium text-gray-700 dark:text-gray-200">
                {isNodeExpanded('languages') ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <Globe className="w-4 h-4" />
                <span>语言</span>
              </div>
            </motion.button>
            
            {isNodeExpanded('languages') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1 ml-4"
              >
                {languageTags.map((tag, index) => (
                  <motion.button
                    key={tag.name}
                    className={cn(
                      'w-full text-left p-2 rounded-md transition-all duration-200',
                      'flex items-center justify-between text-sm',
                      selectedTag === tag.name
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'hover:bg-white/50 text-gray-600 dark:hover:bg-gray-700/50 dark:text-gray-300'
                    )}
                    onClick={() => handleTagClick(tag.name)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span className="capitalize">{tag.name}</span>
                    </div>
                    <span className="text-xs opacity-70">{tag.count}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Timeline Directory */}
        {timelineTree.years.length > 0 && (
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <motion.button
              className="w-full text-left p-3 rounded-lg mb-2 bg-white/30 hover:bg-white/50 dark:bg-gray-700/30 dark:hover:bg-gray-700/50 transition-colors duration-200"
              onClick={() => toggleExpandedNode('timeline')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2 font-medium text-gray-700 dark:text-gray-200">
                {isNodeExpanded('timeline') ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <Calendar className="w-4 h-4" />
                <span>时间线</span>
              </div>
            </motion.button>
            
            {isNodeExpanded('timeline') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-4"
              >
                {timelineTree.years.map(yearNode => renderTimelineNode(yearNode))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Custom Tags Directory */}
        {customTags.length > 0 && (
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <motion.button
              className="w-full text-left p-3 rounded-lg mb-2 bg-white/30 hover:bg-white/50 dark:bg-gray-700/30 dark:hover:bg-gray-700/50 transition-colors duration-200"
              onClick={() => toggleExpandedNode('custom')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2 font-medium text-gray-700 dark:text-gray-200">
                {isNodeExpanded('custom') ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <Tag className="w-4 h-4" />
                <span>自定义标签</span>
              </div>
            </motion.button>
            
            {isNodeExpanded('custom') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1 ml-4"
              >
                {customTags.map((tag, index) => (
                  <motion.button
                    key={tag.name}
                    className={cn(
                      'w-full text-left p-2 rounded-md transition-all duration-200',
                      'flex items-center justify-between text-sm',
                      selectedTag === tag.name
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'hover:bg-white/50 text-gray-600 dark:hover:bg-gray-700/50 dark:text-gray-300'
                    )}
                    onClick={() => handleTagClick(tag.name)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4" />
                      <span>{tag.name}</span>
                    </div>
                    <span className="text-xs opacity-70">{tag.count}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TagSidebar;