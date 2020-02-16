import React, { Component }from 'react';
import PropTypes from 'prop-types';
import GridGallery from 'react-grid-gallery';

export class Gallery extends Component {
    static propTypes = {
        images: PropTypes.arrayOf(
            PropTypes.shape({
                user: PropTypes.string.isRequired,
                src: PropTypes.string.isRequired,
                thumbnail: PropTypes.string.isRequired,
                caption: PropTypes.string.isRequired,
                thumbnailWidth: PropTypes.number.isRequired,
                thumbnailHeight: PropTypes.number.isRequired
            })
        ).isRequired
    }

    render() {
        const images = this.props.images.map((image) => {
            return {
                ...image,
                customOverlay: (
                    <div className="overlay">
                        {`${image.user}: ${image.caption}`}
                    </div>
                ),
            };
        });

        return (
            <div className="gallery">
                <GridGallery
                    images={images}
                    backdropClosesModal={true}
                    enableImageSelection={false}/>
            </div>
        );
    }
}
